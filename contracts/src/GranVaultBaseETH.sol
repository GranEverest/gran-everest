// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IWETH {
    function deposit() external payable;
    function withdraw(uint256) external;
}

interface IUniswapV3SwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut);
}

contract GranVaultBaseETH is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ===== Constants =====

    uint256 public constant LTV_BPS = 7000; // 70% max loan-to-value
    uint256 public constant FEE_BPS = 25;   // 0.25% = 25 / 10_000

    // ===== Immutables (set at deploy, nunca cambian) =====

    IWETH public immutable WETH;
    IERC20 public immutable USDC;
    IERC20 public immutable USDT;
    IUniswapV3SwapRouter public immutable uniV3Router;

    uint24 public immutable FEE_TIER_WETH_USDC;
    uint24 public immutable FEE_TIER_WETH_USDT;

    address public feeRecipient;
    address public guardian;

    // ===== User accounting =====

    // Todas las unidades son 18 decimales (ETH/WETH)
    mapping(address => uint256) public collateral; // colateral en WETH
    mapping(address => uint256) public debt;       // deuda en WETH

    // Anti-loop: bloque del último borrow de cada usuario
    mapping(address => uint256) public lastBorrowBlock;

    uint256 public totalCollateral;
    uint256 public totalDebt;

    // ===== Types / errors / events =====

    enum Stable {
        USDC,
        USDT
    }

    error BorrowDepositSameBlock();
    error InvalidAddress();
    error InvalidAmount();
    error InsufficientLiquidity();
    error LtvExceeded();
    error NoCollateral();
    error NoDebt();
    error DebtOutstanding();
    error ZeroAddressNotAllowed();

    event Deposited(address indexed user, uint256 amountEth, uint256 feeEth);
    event Borrowed(
        address indexed user,
        uint256 amountWeth,
        Stable stableToken,
        uint256 amountStableOut
    );
    event Repaid(address indexed user, uint256 amountWeth);
    event Withdrawn(address indexed user, uint256 amountEth, uint256 feeEth);
    event GuardianUpdated(address indexed newGuardian);
    event FeeRecipientUpdated(address indexed newFeeRecipient);
    event Paused(address indexed by);
    event Unpaused(address indexed by);

    // ===== Modifiers =====

    modifier onlyGuardianOrOwner() {
        if (msg.sender != guardian && msg.sender != owner()) {
            revert InvalidAddress();
        }
        _;
    }

    // ===== Constructor =====

    constructor(
        address _weth,
        address _usdc,
        address _usdt,
        address _uniV3Router,
        uint24 _feeTierWethUsdc,
        uint24 _feeTierWethUsdt,
        address _feeRecipient,
        address _guardian
    ) {
        if (
            _weth == address(0) ||
            _usdc == address(0) ||
            _usdt == address(0) ||
            _uniV3Router == address(0) ||
            _feeRecipient == address(0) ||
            _guardian == address(0)
        ) {
            revert ZeroAddressNotAllowed();
        }

        WETH = IWETH(_weth);
        USDC = IERC20(_usdc);
        USDT = IERC20(_usdt);
        uniV3Router = IUniswapV3SwapRouter(_uniV3Router);

        FEE_TIER_WETH_USDC = _feeTierWethUsdc;
        FEE_TIER_WETH_USDT = _feeTierWethUsdt;

        feeRecipient = _feeRecipient;
        guardian = _guardian;
    }

    // ===== Receive / fallback =====

    /// @dev Sólo acepta ETH que viene de WETH.withdraw().
    /// Cualquier otra cosa revierte para no dejar ETH “perdido” adentro.
    receive() external payable {
        if (msg.sender != address(WETH)) {
            revert InvalidAddress();
        }
    }

    fallback() external payable {
        revert InvalidAddress();
    }

    // ===== Funciones de usuario =====

    /// @notice Depositás ETH como colateral. Se cobra 0.25% de fee.
    /// msg.value = monto total que mandás (colateral + fee).
    function deposit() external payable nonReentrant whenNotPaused {
        uint256 value = msg.value;
        if (value == 0) revert InvalidAmount();

        // Anti-loop: no podés depositar en el mismo bloque donde hiciste borrow
        if (lastBorrowBlock[msg.sender] == block.number) {
            revert BorrowDepositSameBlock();
        }

        uint256 fee = (value * FEE_BPS) / 10_000;
        uint256 amount = value - fee;
        if (amount == 0) revert InvalidAmount();

        // Wrapeamos sólo la parte de colateral a WETH
        WETH.deposit{value: amount}();

        // La fee se manda directo en ETH a la tesorería
        _safeTransferETH(feeRecipient, fee);

        // Contabilidad
        collateral[msg.sender] += amount;
        totalCollateral += amount;

        emit Deposited(msg.sender, amount, fee);
    }

    /// @notice Pedís prestado contra tu colateral y recibís USDC o USDT.
    /// @param amountWeth Monto de deuda en “equivalente WETH” (18 decimales).
    /// @param stableToken USDC o USDT.
    /// @param minAmountOut Mínimo de stables aceptable (protección de slippage).
    function borrow(
        uint256 amountWeth,
        Stable stableToken,
        uint256 minAmountOut
    ) external nonReentrant whenNotPaused {
        if (amountWeth == 0) revert InvalidAmount();
        if (minAmountOut == 0) revert InvalidAmount();

        uint256 userCollateral = collateral[msg.sender];
        if (userCollateral == 0) revert NoCollateral();

        // Calculamos nueva deuda y chequeamos LTV 70%
        uint256 newDebt = debt[msg.sender] + amountWeth;
        uint256 maxDebt = (userCollateral * LTV_BPS) / 10_000;
        if (newDebt > maxDebt) revert LtvExceeded();

        // Chequeamos que el vault tenga liquidez en WETH
        uint256 wethBalance = IERC20(address(WETH)).balanceOf(address(this));
        if (wethBalance < amountWeth) revert InsufficientLiquidity();

        // Efectos
        debt[msg.sender] = newDebt;
        totalDebt += amountWeth;
        lastBorrowBlock[msg.sender] = block.number;

        // Interacciones: swap WETH -> stable seleccionado y lo mandamos al usuario
        address tokenOut = stableToken == Stable.USDC
            ? address(USDC)
            : address(USDT);

        uint256 amountStableOut = _swapWETHForStable(
            tokenOut,
            amountWeth,
            minAmountOut
        );

        IERC20(tokenOut).safeTransfer(msg.sender, amountStableOut);

        emit Borrowed(msg.sender, amountWeth, stableToken, amountStableOut);
    }

    /// @notice Repagás tu deuda usando ETH. Si mandás de más, se te devuelve el sobrante.
    function repay() external payable nonReentrant whenNotPaused {
        uint256 value = msg.value;
        if (value == 0) revert InvalidAmount();

        uint256 userDebt = debt[msg.sender];
        if (userDebt == 0) revert NoDebt();

        uint256 repayAmount = value > userDebt ? userDebt : value;

        // Sólo wrapeamos lo que realmente se usa para repagar
        WETH.deposit{value: repayAmount}();

        // Actualizamos estado
        debt[msg.sender] = userDebt - repayAmount;
        totalDebt -= repayAmount;

        emit Repaid(msg.sender, repayAmount);

        // Devolvemos exceso (si el usuario mandó más ETH de lo que debía)
        if (value > repayAmount) {
            _safeTransferETH(msg.sender, value - repayAmount);
        }
    }

    /// @notice Retirá colateral en ETH. Sólo permitido si tu deuda es exactamente 0.
    function withdraw(uint256 amount)
        external
        nonReentrant
        whenNotPaused
    {
        if (amount == 0) revert InvalidAmount();
        if (debt[msg.sender] != 0) revert DebtOutstanding();

        uint256 userColl = collateral[msg.sender];
        if (userColl < amount) revert InvalidAmount();

        uint256 fee = (amount * FEE_BPS) / 10_000;
        uint256 net = amount - fee;
        if (net == 0) revert InvalidAmount();

        // Actualizamos contabilidad primero
        collateral[msg.sender] = userColl - amount;
        totalCollateral -= amount;

        // Pasamos WETH -> ETH
        WETH.withdraw(amount);

        // Mandamos ETH al usuario y la fee a la tesorería
        _safeTransferETH(msg.sender, net);
        _safeTransferETH(feeRecipient, fee);

        emit Withdrawn(msg.sender, amount, fee);
    }

    /// @notice Retirá todo tu colateral (sólo si tu deuda es 0).
    function withdrawAll() external nonReentrant whenNotPaused {
        uint256 userColl = collateral[msg.sender];
        if (userColl == 0) revert InvalidAmount();
        if (debt[msg.sender] != 0) revert DebtOutstanding();

        uint256 fee = (userColl * FEE_BPS) / 10_000;
        uint256 net = userColl - fee;
        if (net == 0) revert InvalidAmount();

        collateral[msg.sender] = 0;
        totalCollateral -= userColl;

        WETH.withdraw(userColl);

        _safeTransferETH(msg.sender, net);
        _safeTransferETH(feeRecipient, fee);

        emit Withdrawn(msg.sender, userColl, fee);
    }

    // ===== View helpers =====

    function getUserData(address user)
        external
        view
        returns (
            uint256 userCollateral,
            uint256 userDebt,
            uint256 maxBorrow,
            uint256 availableBorrow
        )
    {
        userCollateral = collateral[user];
        userDebt = debt[user];
        maxBorrow = (userCollateral * LTV_BPS) / 10_000;
        availableBorrow = maxBorrow > userDebt ? maxBorrow - userDebt : 0;
    }

    function getVaultState()
        external
        view
        returns (uint256 _totalCollateral, uint256 _totalDebt, uint256 wethBalance)
    {
        _totalCollateral = totalCollateral;
        _totalDebt = totalDebt;
        wethBalance = IERC20(address(WETH)).balanceOf(address(this));
    }

    // ===== Admin / guardian =====

    function setGuardian(address newGuardian) external onlyOwner {
        if (newGuardian == address(0)) revert ZeroAddressNotAllowed();
        guardian = newGuardian;
        emit GuardianUpdated(newGuardian);
    }

    function setFeeRecipient(address newFeeRecipient) external onlyOwner {
        if (newFeeRecipient == address(0)) revert ZeroAddressNotAllowed();
        feeRecipient = newFeeRecipient;
        emit FeeRecipientUpdated(newFeeRecipient);
    }

    function pause() external onlyGuardianOrOwner {
        _pause();
        emit Paused(msg.sender);
    }

    function unpause() external onlyGuardianOrOwner {
        _unpause();
        emit Unpaused(msg.sender);
    }

    // ===== Internal helpers =====

    function _swapWETHForStable(
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) internal returns (uint256 amountOut) {
        // Reseteamos aprobación y volvemos a aprobar el monto exacto
        IERC20(address(WETH)).safeApprove(address(uniV3Router), 0);
        IERC20(address(WETH)).safeApprove(address(uniV3Router), amountIn);

        uint24 feeTier = tokenOut == address(USDC)
            ? FEE_TIER_WETH_USDC
            : FEE_TIER_WETH_USDT;

        IUniswapV3SwapRouter.ExactInputSingleParams memory params =
            IUniswapV3SwapRouter.ExactInputSingleParams({
                tokenIn: address(WETH),
                tokenOut: tokenOut,
                fee: feeTier,
                recipient: address(this),
                deadline: block.timestamp + 300, // 5 minutos
                amountIn: amountIn,
                amountOutMinimum: minAmountOut,
                sqrtPriceLimitX96: 0
            });

        amountOut = uniV3Router.exactInputSingle(params);
    }

    function _safeTransferETH(address to, uint256 amount) internal {
        if (amount == 0) return;
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "ETH_TRANSFER_FAILED");
    }
}
