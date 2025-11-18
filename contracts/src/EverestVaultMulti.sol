// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title EverestVaultMulti
 *
 * @notice
 * - Collateral: ETH
 * - Debt unit: ETH
 * - Max LTV: 70% (hard-coded, not upgradable)
 * - Fee: 0.25% on deposit and withdrawal (same as current vault)
 * - Each user can have multiple numbered vaults (0, 1, 2, ...)
 * - No liquidation risk: any operation that would leave LTV > 70% reverts.
 */
contract EverestVaultMulti is Ownable, Pausable, ReentrancyGuard {
    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    /// @notice Max LTV: 70% (7000 / 10000)
    uint256 public constant MAX_LTV_BPS = 7000; // 70%

    /// @notice Fee 0.25% (25 / 10000) on deposits and withdrawals
    uint256 public constant FEE_BPS = 25; // 0.25%

    /// @notice Basis points denominator (100%)
    uint256 public constant BPS_DENOMINATOR = 10000;

    /// @notice Address that receives protocol fees
    address public immutable feeRecipient;

    // -------------------------------------------------------------------------
    // Storage
    // -------------------------------------------------------------------------

    struct Vault {
        uint256 collateral; // ETH locked as collateral (after fees)
        uint256 debt;       // Debt in ETH units
    }

    /// @notice Number of vaults created by each user (next vault id)
    mapping(address => uint256) private _vaultCounts;

    /// @notice User vaults: user => vaultId => Vault
    mapping(address => mapping(uint256 => Vault)) private _vaults;

    /// @notice Anti-loop guard: last block where user borrowed
    mapping(address => uint256) public lastBorrowBlock;

    /// @notice Global totals for metrics / view
    uint256 public totalCollateral;
    uint256 public totalDebt;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event VaultCreated(address indexed user, uint256 indexed vaultId);

    event Deposited(
        address indexed user,
        uint256 indexed vaultId,
        uint256 amountIn,
        uint256 collateralAdded,
        uint256 feePaid
    );

    event Borrowed(
        address indexed user,
        uint256 indexed vaultId,
        uint256 amount,
        uint256 newDebt
    );

    event Repaid(
        address indexed user,
        uint256 indexed vaultId,
        uint256 amount,
        uint256 remainingDebt
    );

    event Withdrawn(
        address indexed user,
        uint256 indexed vaultId,
        uint256 collateralRemoved,
        uint256 amountOut,
        uint256 feePaid
    );

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(address _feeRecipient) {
        require(_feeRecipient != address(0), "feeRecipient zero");
        feeRecipient = _feeRecipient;
    }

    // -------------------------------------------------------------------------
    // View functions
    // -------------------------------------------------------------------------

    /// @notice Returns how many vaults a user has created
    function vaultCountOf(address user) external view returns (uint256) {
        return _vaultCounts[user];
    }

    /// @notice Returns collateral and debt for a specific vault
    function getVault(address user, uint256 vaultId)
        external
        view
        returns (uint256 collateral, uint256 debt)
    {
        Vault storage v = _vaults[user][vaultId];
        return (v.collateral, v.debt);
    }

    /// @notice Pure helper to compute max borrowable amount for given collateral
    function maxBorrowable(uint256 collateralAmount) public pure returns (uint256) {
        return (collateralAmount * MAX_LTV_BPS) / BPS_DENOMINATOR;
    }

    /// @notice How much more a user can borrow from a given vault right now
    function currentMaxBorrow(address user, uint256 vaultId) external view returns (uint256) {
        Vault storage v = _vaults[user][vaultId];
        if (v.collateral == 0) return 0;
        uint256 limit = maxBorrowable(v.collateral);
        if (v.debt >= limit) return 0;
        return limit - v.debt;
    }

    // -------------------------------------------------------------------------
    // Vault creation
    // -------------------------------------------------------------------------

    /**
     * @notice Creates a new empty vault for msg.sender.
     * @return vaultId ID of the new vault.
     */
    function createVault() external whenNotPaused returns (uint256 vaultId) {
        vaultId = _vaultCounts[msg.sender];
        _vaultCounts[msg.sender] = vaultId + 1;

        emit VaultCreated(msg.sender, vaultId);
    }

    // -------------------------------------------------------------------------
    // Deposit
    // -------------------------------------------------------------------------

    /**
     * @notice Deposit ETH into an existing vault.
     * @dev
     * - Applies 0.25% fee, rest becomes collateral.
     * - DOES NOT change debt.
     * - Can be used while in debt (improves LTV).
     * - Blocks same-block borrow+deposit loops.
     */
    function deposit(uint256 vaultId)
        external
        payable
        whenNotPaused
        nonReentrant
    {
        require(msg.value > 0, "No ETH sent");
        require(vaultId < _vaultCounts[msg.sender], "Vault does not exist");

        // Anti-loop: no deposit in the same block as a borrow
        require(lastBorrowBlock[msg.sender] != block.number, "Borrow+deposit same block");

        uint256 fee = (msg.value * FEE_BPS) / BPS_DENOMINATOR;
        uint256 collateralAdded = msg.value - fee;
        require(collateralAdded > 0, "Deposit too small");

        Vault storage v = _vaults[msg.sender][vaultId];
        v.collateral += collateralAdded;
        totalCollateral += collateralAdded;

        // Send fee to treasury
        (bool okFee, ) = payable(feeRecipient).call{value: fee}("");
        require(okFee, "Fee transfer failed");

        emit Deposited(msg.sender, vaultId, msg.value, collateralAdded, fee);
    }

    // -------------------------------------------------------------------------
    // Borrow
    // -------------------------------------------------------------------------

    /**
     * @notice Borrow ETH from a vault, increasing its debt.
     * @dev
     * - No protocol fee on borrow.
     * - Reverts if new LTV would exceed 70%.
     * - Frontend can later swap this ETH to USDC/USDT/DAI/etc.
     */
    function borrow(uint256 vaultId, uint256 amount)
        external
        whenNotPaused
        nonReentrant
    {
        require(amount > 0, "Amount = 0");
        require(vaultId < _vaultCounts[msg.sender], "Vault does not exist");

        Vault storage v = _vaults[msg.sender][vaultId];
        require(v.collateral > 0, "No collateral");

        // Anti-loop: only one borrow per block per user
        require(lastBorrowBlock[msg.sender] < block.number, "Borrow once per block");
        lastBorrowBlock[msg.sender] = block.number;

        v.debt += amount;
        require(_isHealthy(v.collateral, v.debt), "Max LTV exceeded");

        totalDebt += amount;

        // Send ETH to user
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "ETH transfer failed");

        emit Borrowed(msg.sender, vaultId, amount, v.debt);
    }

    // -------------------------------------------------------------------------
    // Repay
    // -------------------------------------------------------------------------

    /**
     * @notice Repay debt by sending ETH.
     * @dev
     * - DOES NOT change collateral.
     * - If msg.value > debt, the excess is refunded.
     */
    function repay(uint256 vaultId)
        external
        payable
        nonReentrant
    {
        require(msg.value > 0, "No ETH sent");
        require(vaultId < _vaultCounts[msg.sender], "Vault does not exist");

        Vault storage v = _vaults[msg.sender][vaultId];
        require(v.debt > 0, "No debt");

        uint256 amount = msg.value;

        if (amount >= v.debt) {
            uint256 excess = amount - v.debt;

            totalDebt -= v.debt;
            v.debt = 0;

            // Refund excess if any
            if (excess > 0) {
                (bool okRefund, ) = payable(msg.sender).call{value: excess}("");
                require(okRefund, "Refund failed");
                amount = amount - excess;
            }
        } else {
            v.debt -= amount;
            totalDebt -= amount;
        }

        emit Repaid(msg.sender, vaultId, amount, v.debt);
    }

    // -------------------------------------------------------------------------
    // Withdraw
    // -------------------------------------------------------------------------

    /**
     * @notice Withdraw some collateral from a vault.
     * @dev
     * - Applies 0.25% fee, user receives (amount - fee).
     * - Reverts if resulting LTV would exceed 70%.
     */
    function withdraw(uint256 vaultId, uint256 collateralAmount)
        external
        whenNotPaused
        nonReentrant
    {
        require(collateralAmount > 0, "Amount = 0");
        require(vaultId < _vaultCounts[msg.sender], "Vault does not exist");

        Vault storage v = _vaults[msg.sender][vaultId];
        require(v.collateral >= collateralAmount, "Not enough collateral");

        uint256 newCollateral = v.collateral - collateralAmount;
        require(_isHealthy(newCollateral, v.debt), "Max LTV exceeded");

        v.collateral = newCollateral;
        totalCollateral -= collateralAmount;

        uint256 fee = (collateralAmount * FEE_BPS) / BPS_DENOMINATOR;
        uint256 amountOut = collateralAmount - fee;

        // Send fee to treasury
        (bool okFee, ) = payable(feeRecipient).call{value: fee}("");
        require(okFee, "Fee transfer failed");

        // Send net ETH to user
        (bool okUser, ) = payable(msg.sender).call{value: amountOut}("");
        require(okUser, "ETH transfer failed");

        emit Withdrawn(msg.sender, vaultId, collateralAmount, amountOut, fee);
    }

    // -------------------------------------------------------------------------
    // Pause controls
    // -------------------------------------------------------------------------

    /**
     * @notice Pause the contract (only owner).
     * @dev Blocks deposit, borrow and withdraw. Repay still works.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract (only owner).
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    function _isHealthy(uint256 collateralAmount, uint256 debtAmount)
        internal
        pure
        returns (bool)
    {
        if (debtAmount == 0) return true;
        if (collateralAmount == 0) return false;

        uint256 maxDebt = maxBorrowable(collateralAmount);
        return debtAmount <= maxDebt;
    }

    // -------------------------------------------------------------------------
    // Fallback / receive
    // -------------------------------------------------------------------------

    /// @dev Block direct ETH sends; force users to call deposit/repay
    receive() external payable {
        revert("Use deposit/repay");
    }

    fallback() external payable {
        revert("Invalid call");
    }
}
