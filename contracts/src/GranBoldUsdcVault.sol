// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title GranBoldUsdcVault
 * @notice USDC vault for BOLD/USDC strategy on Aerodrome (Base).
 * @dev
 *  - Users deposit and withdraw USDC.
 *  - Vault deploys capital into BOLD/USDC LP + gauge.
 *  - Withdraw fee: 0.3% on the TOTAL amount withdrawn (principal + profit).
 *  - Harvest fee: 0.3% on the PROFIT only (user keeps all shares; no principal touch).
 *  - Compound: 0% fee, user just pays gas.
 */
contract GranBoldUsdcVault is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // =============================================================
    //                           ERRORS
    // =============================================================

    error ZeroAddress();
    error ZeroAmount();
    error BelowMinDeposit();
    error AboveMaxDeposit();
    error AboveMaxWithdraw();
    error NoShares();
    error NoProfit();
    error SlippageTooHigh();
    error PoolConfigMismatch();
    error StrategyRatioTooHigh();
    error PriceOutOfRange();
    error InsufficientLiquidity();
    error DeadlineExpired();
    error InvalidLimits();
    error CannotRecoverToken();

    // =============================================================
    //                         CONSTANTS
    // =============================================================

    IERC20 public immutable usdc;

    // BOLD token on Base (18 decimals)
    IERC20 public constant BOLD =
        IERC20(0x03569CC076654F82679C4BA2124D64774781B01D);

    // BOLD/USDC LP token (Aerodrome pool)
    IERC20 public constant AERO_POOL =
        IERC20(0x2De3fE21d32319a1550264dA37846737885Ad7A1);

    // Gauge for the BOLD/USDC pool
    address public constant AERO_GAUGE =
        0x7fDCBc8C442C667D41a1041bdc6e588393cEb6fe;

    // Aerodrome router (Base)
    address public constant AERO_ROUTER =
        0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43;

    // Pool is configured as a stable pair
    bool public constant IS_STABLE_POOL = true;

    uint256 public constant FEE_DENOMINATOR = 10_000;
    uint256 public constant WITHDRAW_FEE_BPS = 30; // 0.3% on TOTAL withdrawn
    uint256 public constant HARVEST_FEE_BPS = 30;  // 0.3% on PROFIT only
    uint256 public constant SCALE = 1e18;

    // =============================================================
    //                          STATE
    // =============================================================

    // Shares accounting
    uint256 public totalShares;
    mapping(address => uint256) public shares;

    // User principal tracking (for fee on profit)
    mapping(address => uint256) public userPrincipal;
    uint256 public totalPrincipal;

    // Fee recipient (treasury)
    address public feeRecipient;

    // Per-tx limits and idle buffer
    uint256 public maxDepositPerTx;
    uint256 public maxWithdrawPerTx;
    uint256 public minDeposit;
    uint256 public idleBuffer;

    // Risk parameters
    uint256 public maxStrategyRatio = 9_000;     // 90% of TVL in strategy
    uint256 public maxPriceDeviationBps = 1_000; // ±10% around reference

    struct UserInfo {
        uint256 totalDeposited;
        uint256 totalWithdrawn;
        uint64 lastDepositTime;
    }

    mapping(address => UserInfo) public userInfo;

    // =============================================================
    //                           EVENTS
    // =============================================================

    event Deposit(
        address indexed user,
        uint256 assets,
        uint256 sharesMinted
    );

    event Withdraw(
        address indexed user,
        uint256 sharesBurned,
        uint256 grossAssets,
        uint256 fee,
        uint256 netAssets
    );

    event Harvest(
        address indexed user,
        uint256 profit,
        uint256 fee,
        uint256 netPayout
    );

    event Compound(
        address indexed user,
        uint256 oldPrincipal,
        uint256 newPrincipal
    );

    event StrategyInvested(
        uint256 usdcDeployed,
        uint256 lpMinted
    );

    event StrategyDivested(
        uint256 targetIdle,
        uint256 lpBurned,
        uint256 usdcReceived
    );

    event LimitsUpdated(
        uint256 maxDepositPerTx,
        uint256 maxWithdrawPerTx,
        uint256 minDeposit
    );

    event IdleBufferUpdated(uint256 newIdleBuffer);
    event StrategyRatioUpdated(uint256 newRatioBps);
    event PriceDeviationUpdated(uint256 newDeviationBps);
    event FeeRecipientUpdated(address newRecipient);

    event RewardsClaimed(
        address indexed caller,
        address[] tokens,
        address indexed recipient
    );

    // =============================================================
    //                        CONSTRUCTOR
    // =============================================================

    constructor(
        address _usdc,
        address _owner,
        address _feeRecipient,
        uint256 _maxDepositPerTx,
        uint256 _maxWithdrawPerTx,
        uint256 _minDeposit
    ) Ownable(_owner) {
        if (_usdc == address(0) || _owner == address(0) || _feeRecipient == address(0)) {
            revert ZeroAddress();
        }
        if (_maxDepositPerTx == 0 || _maxWithdrawPerTx == 0) {
            revert InvalidLimits();
        }
        if (_minDeposit > _maxDepositPerTx) {
            revert InvalidLimits();
        }

        usdc = IERC20(_usdc);
        feeRecipient = _feeRecipient;
        maxDepositPerTx = _maxDepositPerTx;
        maxWithdrawPerTx = _maxWithdrawPerTx;
        minDeposit = _minDeposit;
    }

    // =============================================================
    //                    INTERNAL HELPERS (POOL)
    // =============================================================

    function _getPoolReserves()
        internal
        view
        returns (
            uint256 reserveUsdc,
            uint256 reserveBold,
            uint256 totalSupplyLp,
            bool ok
        )
    {
        IAeroPool pool = IAeroPool(address(AERO_POOL));
        (uint256 r0, uint256 r1, ) = pool.getReserves();
        totalSupplyLp = pool.totalSupply();
        if (totalSupplyLp == 0) {
            return (0, 0, 0, false);
        }

        address t0 = pool.token0();
        address t1 = pool.token1();

        if (t0 == address(usdc) && t1 == address(BOLD)) {
            reserveUsdc = r0;
            reserveBold = r1;
            ok = true;
        } else if (t0 == address(BOLD) && t1 == address(usdc)) {
            reserveUsdc = r1;
            reserveBold = r0;
            ok = true;
        } else {
            ok = false;
        }
    }

    /// @dev BOLD has 18 decimals, USDC has 6 → divide by 1e12 to match USDC units.
    function _normalizeBoldToUsdcDecimals(uint256 reserveBold)
        internal
        pure
        returns (uint256)
    {
        return reserveBold / 1e12;
    }

    function _strategyAssetsInUsdc() internal view returns (uint256) {
        uint256 lpWallet = AERO_POOL.balanceOf(address(this));
        uint256 lpStaked = IAerodromeGauge(AERO_GAUGE).balanceOf(address(this));
        uint256 lpTotal = lpWallet + lpStaked;
        if (lpTotal == 0) return 0;

        (uint256 reserveUsdc, uint256 reserveBold, uint256 totalSupplyLp, bool ok) =
            _getPoolReserves();
        if (!ok || totalSupplyLp == 0) return 0;

        uint256 boldInUsdc = _normalizeBoldToUsdcDecimals(reserveBold);
        uint256 poolValueUsdc = reserveUsdc + boldInUsdc;

        return Math.mulDiv(lpTotal, poolValueUsdc, totalSupplyLp);
    }

    /// @notice Total vault assets in USDC (idle + strategy).
    function totalAssets() public view returns (uint256) {
        return usdc.balanceOf(address(this)) + _strategyAssetsInUsdc();
    }

    function convertToShares(uint256 assets) public view returns (uint256) {
        uint256 _totalShares = totalShares;
        uint256 _totalAssets = totalAssets();

        if (assets == 0) return 0;
        if (_totalShares == 0 || _totalAssets == 0) {
            // First depositor: 1:1 mapping
            return assets;
        }

        return Math.mulDiv(
            assets,
            _totalShares,
            _totalAssets,
            Math.Rounding.Floor
        );
    }

    function convertToAssets(uint256 _shares) public view returns (uint256) {
        uint256 _totalShares = totalShares;
        uint256 _totalAssets = totalAssets();
        if (_shares == 0 || _totalShares == 0) return 0;

        return Math.mulDiv(_shares, _totalAssets, _totalShares, Math.Rounding.Floor);
    }

    function userValue(address user) public view returns (uint256) {
        uint256 s = shares[user];
        if (s == 0 || totalShares == 0) return 0;
        return Math.mulDiv(s, totalAssets(), totalShares, Math.Rounding.Floor);
    }

    function userProfit(address user) public view returns (uint256) {
        uint256 v = userValue(user);
        uint256 p = userPrincipal[user];
        return v > p ? (v - p) : 0;
    }

    // =============================================================
    //                    INTERNAL APPROVE HELPER
    // =============================================================

    function _safeApprove(
        IERC20 token,
        address spender,
        uint256 amount
    ) internal {
        // OpenZeppelin v5: SafeERC20 exposes forceApprove instead of safeApprove.
        // It internally handles the "set to 0 then set to amount" pattern.
        token.forceApprove(spender, amount);
    }

    // =============================================================
    //                    DEPOSIT / WITHDRAW / EMERGENCY
    // =============================================================

    /**
     * @notice Deposit USDC into the vault and receive vault shares.
     * @param assets Amount of USDC to deposit.
     */
    function deposit(uint256 assets)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 mintedShares)
    {
        if (assets == 0) revert ZeroAmount();
        if (assets < minDeposit) revert BelowMinDeposit();
        if (assets > maxDepositPerTx) revert AboveMaxDeposit();

        // Compute shares before pulling funds (for accurate totalAssets).
        mintedShares = convertToShares(assets);
        if (mintedShares == 0) revert NoShares();

        usdc.safeTransferFrom(msg.sender, address(this), assets);

        shares[msg.sender] += mintedShares;
        totalShares += mintedShares;

        userPrincipal[msg.sender] += assets;
        totalPrincipal += assets;

        UserInfo storage info = userInfo[msg.sender];
        info.totalDeposited += assets;
        info.lastDepositTime = uint64(block.timestamp);

        emit Deposit(msg.sender, assets, mintedShares);
    }

    /**
     * @notice Withdraw USDC from the vault, burning shares.
     * @param shareAmount      Amount of shares to burn.
     * @param minNetAssetsOut  Minimum net USDC the user is willing to receive (after fee).
     * @param minUsdcFromDivest Minimum USDC the user expects the divest to produce (slippage protection).
     * @param deadline         Unix timestamp after which the tx must not be executed.
     */
    function withdraw(
        uint256 shareAmount,
        uint256 minNetAssetsOut,
        uint256 minUsdcFromDivest,
        uint256 deadline
    ) external nonReentrant whenNotPaused returns (uint256 netAssets) {
        if (block.timestamp > deadline) revert DeadlineExpired();
        if (shareAmount == 0) revert ZeroAmount();

        uint256 userShares = shares[msg.sender];
        if (userShares < shareAmount) revert NoShares();

        uint256 _totalShares = totalShares;
        uint256 totalAssetsBefore = totalAssets();

        // Gross assets corresponding to those shares
        uint256 grossAssets = Math.mulDiv(
            shareAmount,
            totalAssetsBefore,
            _totalShares,
            Math.Rounding.Floor
        );
        if (grossAssets == 0) revert ZeroAmount();
        if (grossAssets > maxWithdrawPerTx) revert AboveMaxWithdraw();

        uint256 fee = (grossAssets * WITHDRAW_FEE_BPS) / FEE_DENOMINATOR;
        netAssets = grossAssets - fee;

        if (netAssets < minNetAssetsOut) revert SlippageTooHigh();

        // Ensure enough idle USDC (may divest LP)
        _ensureSufficientIdle(grossAssets, minUsdcFromDivest, deadline);

        uint256 idle = usdc.balanceOf(address(this));
        if (idle < grossAssets) revert InsufficientLiquidity();

        // Adjust principal proportionally to burned shares
        uint256 principalBefore = userPrincipal[msg.sender];
        if (principalBefore > 0) {
            uint256 principalPortion = Math.mulDiv(
                principalBefore,
                shareAmount,
                userShares,
                Math.Rounding.Floor
            );
            userPrincipal[msg.sender] = principalBefore - principalPortion;
            totalPrincipal -= principalPortion;
        }

        // Burn shares
        shares[msg.sender] = userShares - shareAmount;
        totalShares = _totalShares - shareAmount;

        // Update statistics
        userInfo[msg.sender].totalWithdrawn += netAssets;

        // Send funds
        if (fee > 0 && feeRecipient != address(0)) {
            usdc.safeTransfer(feeRecipient, fee);
        }
        usdc.safeTransfer(msg.sender, netAssets);

        emit Withdraw(msg.sender, shareAmount, grossAssets, fee, netAssets);
    }

    /**
     * @notice Emergency withdraw using only idle USDC (no divest).
     * @dev Can only be used when the vault is paused.
     */
    function emergencyWithdraw() external nonReentrant whenPaused {
        uint256 userShares = shares[msg.sender];
        if (userShares == 0) revert NoShares();

        uint256 _totalShares = totalShares;
        uint256 idle = usdc.balanceOf(address(this));

        // pro-rata share of idle only (strategy remains untouched)
        uint256 userIdleAssets = Math.mulDiv(
            userShares,
            idle,
            _totalShares,
            Math.Rounding.Floor
        );

        shares[msg.sender] = 0;
        totalShares = _totalShares - userShares;

        // We do NOT adjust userPrincipal here: this is an emergency path.
        // Users may receive less than their principal if most funds are in strategy.

        if (userIdleAssets > 0) {
            usdc.safeTransfer(msg.sender, userIdleAssets);
        }
    }

    // =============================================================
    //                      HARVEST / COMPOUND
    // =============================================================

    /**
     * @notice Harvest profits for the caller.
     * @dev
     *  - Only PROFIT is used as base for the 0.3% fee.
     *  - User keeps all their shares.
     *  - After harvest, the user's principal is updated to their new
     *    invested value, so they don't pay fee again on old profits.
     */
    function harvest(
        uint256 minNetProfitOut,
        uint256 minUsdcFromDivest,
        uint256 deadline
    ) external nonReentrant whenNotPaused returns (uint256 netPayout) {
        if (block.timestamp > deadline) revert DeadlineExpired();

        uint256 userShares = shares[msg.sender];
        if (userShares == 0) revert NoShares();

        uint256 _totalShares = totalShares;
        uint256 totalAssetsBefore = totalAssets();

        uint256 userValueBefore = Math.mulDiv(
            userShares,
            totalAssetsBefore,
            _totalShares,
            Math.Rounding.Floor
        );

        uint256 principalBefore = userPrincipal[msg.sender];
        if (userValueBefore <= principalBefore) revert NoProfit();

        uint256 profit = userValueBefore - principalBefore;
        uint256 fee = (profit * HARVEST_FEE_BPS) / FEE_DENOMINATOR;
        netPayout = profit - fee;

        if (netPayout < minNetProfitOut) revert SlippageTooHigh();

        // We need 'profit' USDC available to pay fee + netPayout
        _ensureSufficientIdle(profit, minUsdcFromDivest, deadline);

        uint256 idle = usdc.balanceOf(address(this));
        if (idle < profit) revert InsufficientLiquidity();

        // Remove gross profit from vault assets
        // (We conceptually pay fee + netPayout out of the vault)
        // totalAssetsAfter = totalAssetsBefore - profit
        // We recompute user value after this removal and set that as new principal.
        uint256 totalAssetsAfter = totalAssetsBefore - profit;

        uint256 userValueAfter = Math.mulDiv(
            userShares,
            totalAssetsAfter,
            _totalShares,
            Math.Rounding.Floor
        );

        // Update principal baseline for this user
        userPrincipal[msg.sender] = userValueAfter;

        // Update global principal tracking
        // totalPrincipal = oldTotalPrincipal - oldPrincipalUser + newPrincipalUser
        totalPrincipal = totalPrincipal - principalBefore + userValueAfter;

        // Transfer fee + net payout
        if (fee > 0 && feeRecipient != address(0)) {
            usdc.safeTransfer(feeRecipient, fee);
        }
        usdc.safeTransfer(msg.sender, netPayout);

        emit Harvest(msg.sender, profit, fee, netPayout);
    }

    /**
     * @notice Compounds profits into principal (no fee, just gas).
     * @dev
     *  - No tokens move.
     *  - Principal is updated to current user value.
     *  - Future profit is measured from this new baseline.
     */
    function compound() external nonReentrant whenNotPaused {
        uint256 userShares = shares[msg.sender];
        if (userShares == 0) revert NoShares();

        uint256 _totalShares = totalShares;
        uint256 v = Math.mulDiv(
            userShares,
            totalAssets(),
            _totalShares,
            Math.Rounding.Floor
        );
        uint256 oldPrincipal = userPrincipal[msg.sender];

        if (v <= oldPrincipal) {
            // Nothing to compound
            return;
        }

        userPrincipal[msg.sender] = v;
        totalPrincipal = totalPrincipal - oldPrincipal + v;

        emit Compound(msg.sender, oldPrincipal, v);
    }

    // =============================================================
    //                   STRATEGY DIVEST (INTERNAL)
    // =============================================================

    /**
     * @dev Ensures there is at least `neededUsdc` idle.
     *      If not, divests from BOLD/USDC LP and swaps BOLD → USDC.
     *
     *      `minUsdcFromDivest` protects the user from excessive slippage:
     *      the total extra USDC obtained from the divest must be >= `minUsdcFromDivest`.
     */
    function _ensureSufficientIdle(
        uint256 neededUsdc,
        uint256 minUsdcFromDivest,
        uint256 deadline
    ) internal {
        uint256 idleBefore = usdc.balanceOf(address(this));
        if (idleBefore >= neededUsdc) {
            return;
        }

        uint256 need = neededUsdc - idleBefore;

        uint256 lpWallet = AERO_POOL.balanceOf(address(this));
        uint256 lpStaked = IAerodromeGauge(AERO_GAUGE).balanceOf(address(this));
        uint256 lpTotal = lpWallet + lpStaked;
        if (lpTotal == 0) revert InsufficientLiquidity();

        (
            uint256 reserveUsdc,
            uint256 reserveBold,
            uint256 totalSupplyLp,
            bool ok
        ) = _getPoolReserves();

        if (!ok || totalSupplyLp == 0) revert PoolConfigMismatch();

        uint256 boldInUsdc = _normalizeBoldToUsdcDecimals(reserveBold);
        uint256 poolValueUsdc = reserveUsdc + boldInUsdc;

        uint256 vaultValueUsdc = Math.mulDiv(
            lpTotal,
            poolValueUsdc,
            totalSupplyLp,
            Math.Rounding.Floor
        );

        uint256 lpToBurn;
        if (vaultValueUsdc <= need) {
            lpToBurn = lpTotal;
        } else {
            lpToBurn = Math.mulDiv(
                lpTotal,
                need,
                vaultValueUsdc,
                Math.Rounding.Ceil
            );
        }

        if (lpToBurn == 0) revert InsufficientLiquidity();

        // Unstake from gauge if needed
        if (lpStaked > 0) {
            uint256 toWithdraw = lpToBurn <= lpStaked ? lpToBurn : lpStaked;
            IAerodromeGauge(AERO_GAUGE).withdraw(toWithdraw);
        }

        uint256 lpAvailable = AERO_POOL.balanceOf(address(this));
        if (lpAvailable < lpToBurn) {
            lpToBurn = lpAvailable;
        }
        if (lpToBurn == 0) revert InsufficientLiquidity();

        uint256 idleBeforeDivest = usdc.balanceOf(address(this));

        // Approve LP to router
        _safeApprove(AERO_POOL, AERO_ROUTER, lpToBurn);

        (uint256 amountUsdc, uint256 amountBold) = IAeroRouter(AERO_ROUTER)
            .removeLiquidity(
                address(usdc),
                address(BOLD),
                IS_STABLE_POOL,
                lpToBurn,
                0,
                0,
                address(this),
                deadline
            );

        // USDC from removeLiquidity
        uint256 usdcOut = amountUsdc;

        // Swap BOLD → USDC
        if (amountBold > 0) {
            _safeApprove(BOLD, AERO_ROUTER, amountBold);

            uint256[] memory swapAmounts = IAeroRouter(AERO_ROUTER)
                .swapExactTokensForTokensSimple(
                    amountBold,
                    0, // additional slippage protection is via minUsdcFromDivest
                    address(BOLD),
                    address(usdc),
                    IS_STABLE_POOL,
                    address(this),
                    deadline
                );

            usdcOut += swapAmounts[swapAmounts.length - 1];
        }

        uint256 idleAfter = usdc.balanceOf(address(this));
        uint256 added = idleAfter - idleBeforeDivest;

        if (added < minUsdcFromDivest) revert SlippageTooHigh();

        emit StrategyDivested(neededUsdc, lpToBurn, usdcOut);
    }

    // =============================================================
    //                   STRATEGY INVEST (ONLY OWNER)
    // =============================================================

    /**
     * @notice Invest all idle USDC into the BOLD/USDC strategy.
     * @param minBoldOut Minimum BOLD expected from the USDC → BOLD swap.
     * @param minLpOut   Minimum LP expected from addLiquidity.
     * @param deadline   Unix timestamp after which the tx must not be executed.
     */
    function investAllIdle(
        uint256 minBoldOut,
        uint256 minLpOut,
        uint256 deadline
    ) external onlyOwner whenNotPaused nonReentrant {
        if (block.timestamp > deadline) revert DeadlineExpired();

        uint256 idle = usdc.balanceOf(address(this));
        if (idle <= idleBuffer) {
            revert InsufficientLiquidity();
        }

        uint256 toInvest = idle - idleBuffer;
        if (toInvest == 0) revert InsufficientLiquidity();

        // Strategy ratio limit (do not exceed maxStrategyRatio)
        if (maxStrategyRatio > 0) {
            uint256 stratBefore = _strategyAssetsInUsdc();
            uint256 totalBefore = stratBefore + idle;
            if (totalBefore > 0) {
                uint256 newStrategy = stratBefore + toInvest;
                uint256 ratioBps = Math.mulDiv(
                    newStrategy,
                    FEE_DENOMINATOR,
                    totalBefore,
                    Math.Rounding.Floor
                );
                if (ratioBps > maxStrategyRatio) revert StrategyRatioTooHigh();
            }
        }

        // Optional protection via pool price band (approx)
        if (maxPriceDeviationBps > 0) {
            (
                uint256 reserveUsdc,
                uint256 reserveBold,
                ,
                bool ok
            ) = _getPoolReserves();
            if (!ok) revert PoolConfigMismatch();

            uint256 boldInUsdc = _normalizeBoldToUsdcDecimals(reserveBold);
            if (boldInUsdc == 0) revert PriceOutOfRange();

            // Price of 1 BOLD in USDC units, scaled 1e18
            uint256 price = Math.mulDiv(
                reserveUsdc,
                1e18,
                boldInUsdc,
                Math.Rounding.Floor
            );

            uint256 dev = maxPriceDeviationBps;
            uint256 lower = (1e18 * (FEE_DENOMINATOR - dev)) / FEE_DENOMINATOR;
            uint256 upper = (1e18 * (FEE_DENOMINATOR + dev)) / FEE_DENOMINATOR;

            if (price < lower || price > upper) revert PriceOutOfRange();
        }

        // 1) Swap half of USDC → BOLD
        uint256 usdcForBold = toInvest / 2;
        uint256 usdcForPool = toInvest - usdcForBold;

        _safeApprove(usdc, AERO_ROUTER, usdcForBold);
        uint256[] memory amounts = IAeroRouter(AERO_ROUTER)
            .swapExactTokensForTokensSimple(
                usdcForBold,
                minBoldOut,
                address(usdc),
                address(BOLD),
                IS_STABLE_POOL,
                address(this),
                deadline
            );
        uint256 boldReceived = amounts[amounts.length - 1];

        // 2) Add liquidity with the other half of USDC + all BOLD
        _safeApprove(usdc, AERO_ROUTER, usdcForPool);
        _safeApprove(BOLD, AERO_ROUTER, boldReceived);

        (uint256 amountUsdcUsed, uint256 amountBoldUsed, uint256 liquidity) =
            IAeroRouter(AERO_ROUTER).addLiquidity(
                address(usdc),
                address(BOLD),
                IS_STABLE_POOL,
                usdcForPool,
                boldReceived,
                0,
                0,
                address(this),
                deadline
            );

        if (liquidity < minLpOut) revert InsufficientLiquidity();

        // 3) Stake LP in gauge
        _safeApprove(AERO_POOL, AERO_GAUGE, liquidity);
        IAerodromeGauge(AERO_GAUGE).deposit(liquidity);

        emit StrategyInvested(amountUsdcUsed + amountBoldUsed, liquidity);
    }

    // =============================================================
    //               GAUGE REWARDS → TREASURY (ONLY OWNER)
    // =============================================================

    /**
     * @notice Claim rewards from the gauge and sweep them to the feeRecipient.
     * @dev
     *  - `rewardTokens` is a list of reward token addresses the owner expects.
     *  - Any token that is not USDC / BOLD / LP is transferred to feeRecipient.
     *  - We intentionally do NOT treat rewards as part of vault TVL.
     */
    function claimRewards(address[] calldata rewardTokens) external onlyOwner {
        IAerodromeGauge(AERO_GAUGE).getReward();

        address recipient = feeRecipient;
        if (recipient == address(0)) revert ZeroAddress();

        uint256 len = rewardTokens.length;
        for (uint256 i = 0; i < len; ) {
            address token = rewardTokens[i];

            // Never sweep core vault assets
            if (
                token != address(usdc) &&
                token != address(BOLD) &&
                token != address(AERO_POOL)
            ) {
                uint256 bal = IERC20(token).balanceOf(address(this));
                if (bal > 0) {
                    IERC20(token).safeTransfer(recipient, bal);
                }
            }

            unchecked {
                ++i;
            }
        }

        emit RewardsClaimed(msg.sender, rewardTokens, recipient);
    }

    // =============================================================
    //                       ADMIN FUNCTIONS
    // =============================================================

    function setFeeRecipient(address newRecipient) external onlyOwner {
        if (newRecipient == address(0)) revert ZeroAddress();
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(newRecipient);
    }

    function updateLimits(
        uint256 newMaxDepositPerTx,
        uint256 newMaxWithdrawPerTx,
        uint256 newMinDeposit
    ) external onlyOwner {
        if (newMaxDepositPerTx == 0 || newMaxWithdrawPerTx == 0) {
            revert InvalidLimits();
        }
        if (newMinDeposit > newMaxDepositPerTx) {
            revert InvalidLimits();
        }

        maxDepositPerTx = newMaxDepositPerTx;
        maxWithdrawPerTx = newMaxWithdrawPerTx;
        minDeposit = newMinDeposit;

        emit LimitsUpdated(newMaxDepositPerTx, newMaxWithdrawPerTx, newMinDeposit);
    }

    function setIdleBuffer(uint256 newIdleBuffer) external onlyOwner {
        idleBuffer = newIdleBuffer;
        emit IdleBufferUpdated(newIdleBuffer);
    }

    function setMaxStrategyRatio(uint256 newRatioBps) external onlyOwner {
        if (newRatioBps > FEE_DENOMINATOR) revert StrategyRatioTooHigh();
        maxStrategyRatio = newRatioBps;
        emit StrategyRatioUpdated(newRatioBps);
    }

    function setMaxPriceDeviationBps(uint256 newDeviationBps) external onlyOwner {
        if (newDeviationBps > FEE_DENOMINATOR) revert InvalidLimits();
        maxPriceDeviationBps = newDeviationBps;
        emit PriceDeviationUpdated(newDeviationBps);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Recover arbitrary ERC20 tokens that are NOT core vault assets.
     */
    function recoverERC20(address token, uint256 amount) external onlyOwner {
        if (amount == 0) revert ZeroAmount();
        if (
            token == address(usdc) ||
            token == address(BOLD) ||
            token == address(AERO_POOL)
        ) {
            revert CannotRecoverToken();
        }
        IERC20(token).safeTransfer(owner(), amount);
    }
}

// =============================================================
//                       AERODROME INTERFACES
// =============================================================

interface IAeroPool {
    function getReserves()
        external
        view
        returns (uint256 reserve0, uint256 reserve1, uint32 blockTimestampLast);

    function token0() external view returns (address);
    function token1() external view returns (address);

    function totalSupply() external view returns (uint256);
}

interface IAeroRouter {
    function addLiquidity(
        address tokenA,
        address tokenB,
        bool stable,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity);

    function removeLiquidity(
        address tokenA,
        address tokenB,
        bool stable,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB);

    function swapExactTokensForTokensSimple(
        uint256 amountIn,
        uint256 amountOutMin,
        address tokenFrom,
        address tokenTo,
        bool stable,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

interface IAerodromeGauge {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
    function getReward() external;
}
