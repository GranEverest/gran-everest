// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
 * EverestVault (ETH-only)
 * - LTV = 70%
 * - Fee 0.25% (25 bps) en deposit & withdraw únicamente (borrow/repay sin fee)
 * - Anti-loop on-chain: si el usuario hace borrow en un bloque, no puede depositar en ese mismo bloque
 * - Pausable por owner o guardian
 * - Owner/Guardian/FeeRecipient configurables (al deploy y vía setters del owner)
 *
 * Semántica de fees:
 * - deposit(): el usuario envía ETH y se acredita NETO (msg.value - 0.25%) a su colateral. El 0.25% va a feeRecipient.
 * - withdraw(amount): el usuario recibe (amount - 0.25%) y el 0.25% va a feeRecipient.
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract EverestVault is Ownable, ReentrancyGuard {
    // ===== Constantes del modelo =====
    uint16 public constant LTV_BPS = 7000;  // 70.00%
    uint16 public constant FEE_BPS = 25;    // 0.25% (25 / 10_000)

    // ===== Roles y control =====
    address public guardian;
    address public feeRecipient;
    bool    public paused;

    // ===== Estado por usuario =====
    mapping(address => uint256) public collateral;       // ETH en garantía (neto)
    mapping(address => uint256) public debt;             // Deuda en ETH
    mapping(address => uint256) public lastBorrowBlock;  // Bloque del último borrow (anti-loop)

    // ===== Eventos =====
    event Deposited(address indexed user, uint256 grossAmount, uint256 fee, uint256 netCollateral);
    event Withdrawn(address indexed user, uint256 requestedAmount, uint256 fee, uint256 netToUser);
    event Borrowed(address indexed user, uint256 amount);
    event Repaid(address indexed user, uint256 amount, uint256 refund);
    event GuardianUpdated(address indexed newGuardian);
    event FeeRecipientUpdated(address indexed newFeeRecipient);
    event Paused(address indexed by);
    event Unpaused(address indexed by);

    // ===== Errores =====
    error PausedError();
    error ZeroAddress();
    error ZeroAmount();
    error BorrowDepositSameBlock();
    error ExceedsBorrowLimit();
    error InsufficientCollateral();
    error TransferFailed();

    // ===== Modificadores =====
    modifier whenNotPaused() {
        if (paused) revert PausedError();
        _;
    }

    modifier onlyGuardianOrOwner() {
        require(msg.sender == owner() || msg.sender == guardian, "Not guardian/owner");
        _;
    }

    // feeRecipient se define al deploy
    constructor(address _feeRecipient) {
        if (_feeRecipient == address(0)) revert ZeroAddress();
        feeRecipient = _feeRecipient;
    }

    // ===== Vistas =====
    function borrowLimit(address user) public view returns (uint256) {
        return (collateral[user] * LTV_BPS) / 10_000;
    }

    function availableToBorrow(address user) public view returns (uint256) {
        uint256 limit = borrowLimit(user);
        uint256 d = debt[user];
        return d >= limit ? 0 : (limit - d);
    }

    function getUserData(address user)
        external
        view
        returns (uint256 _collateral, uint256 _debt, uint256 _maxBorrow, uint256 _available)
    {
        _collateral = collateral[user];
        _debt = debt[user];
        _maxBorrow = borrowLimit(user);
        _available = availableToBorrow(user);
    }

    // ===== Gestión de roles =====
    function setGuardian(address _guardian) external onlyOwner {
        if (_guardian == address(0)) revert ZeroAddress();
        guardian = _guardian;
        emit GuardianUpdated(_guardian);
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        if (_feeRecipient == address(0)) revert ZeroAddress();
        feeRecipient = _feeRecipient;
        emit FeeRecipientUpdated(_feeRecipient);
    }

    function pause() external onlyGuardianOrOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyGuardianOrOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    // ===== Núcleo =====

    /// @notice Deposita ETH. Se descuenta 0.25% a tesorería; se acredita neto al colateral.
    function deposit() external payable nonReentrant whenNotPaused {
        if (msg.value == 0) revert ZeroAmount();
        if (lastBorrowBlock[msg.sender] == block.number) revert BorrowDepositSameBlock();

        uint256 fee = (msg.value * FEE_BPS) / 10_000;
        uint256 net = msg.value - fee;

        collateral[msg.sender] += net;

        if (fee > 0) _safeSendETH(feeRecipient, fee);

        emit Deposited(msg.sender, msg.value, fee, net);
    }

    /// @notice Pide prestado ETH (sin fee). Respeta LTV 70%.
    function borrow(uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert ZeroAmount();

        uint256 newDebt = debt[msg.sender] + amount;
        uint256 limit = borrowLimit(msg.sender);
        if (newDebt > limit) revert ExceedsBorrowLimit();

        debt[msg.sender] = newDebt;
        lastBorrowBlock[msg.sender] = block.number;

        _safeSendETH(msg.sender, amount);
        emit Borrowed(msg.sender, amount);
    }

    /// @notice Devuelve deuda con ETH. Si sobrepaga, reembolsa el excedente.
    function repay() external payable nonReentrant whenNotPaused {
        if (msg.value == 0) revert ZeroAmount();
        uint256 d = debt[msg.sender];

        if (d == 0) {
            _safeSendETH(msg.sender, msg.value);
            emit Repaid(msg.sender, 0, msg.value);
            return;
        }

        if (msg.value >= d) {
            uint256 refund = msg.value - d;
            debt[msg.sender] = 0;
            if (refund > 0) _safeSendETH(msg.sender, refund);
            emit Repaid(msg.sender, d, refund);
        } else {
            debt[msg.sender] = d - msg.value;
            emit Repaid(msg.sender, msg.value, 0);
        }
    }

    /// @notice Retira parte del colateral. Se descuenta 0.25% del monto retirado.
    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        uint256 c = collateral[msg.sender];
        if (amount > c) revert InsufficientCollateral();

        // Verificación LTV post-retiro
        uint256 newCollateral = c - amount;
        uint256 limitAfter = (newCollateral * LTV_BPS) / 10_000;
        if (debt[msg.sender] > limitAfter) revert ExceedsBorrowLimit();

        collateral[msg.sender] = newCollateral;

        uint256 fee = (amount * FEE_BPS) / 10_000;
        uint256 net = amount - fee;

        if (fee > 0) _safeSendETH(feeRecipient, fee);
        _safeSendETH(msg.sender, net);

        emit Withdrawn(msg.sender, amount, fee, net);
    }

    // ===== Utilidades =====
    function _safeSendETH(address to, uint256 value) internal {
        (bool ok, ) = payable(to).call{value: value}("");
        if (!ok) revert TransferFailed();
    }

    // Recibe ETH (por si alguien envía directo)
    receive() external payable {}
}
