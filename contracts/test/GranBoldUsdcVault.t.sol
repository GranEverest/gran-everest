// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/GranBoldUsdcVault.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// ---------------------------------------------------------------------
// Mock USDC (6 decimals)
// ---------------------------------------------------------------------
contract MockUSDC is ERC20 {
    uint8 private _decimals;

    constructor() ERC20("Mock USDC", "USDC") {
        _decimals = 6;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

// ---------------------------------------------------------------------
// Minimal stubs for Aerodrome pool & gauge so totalAssets() doesn't revert
// ---------------------------------------------------------------------
contract StubAeroPool {
    // Used via IERC20(AERO_POOL).balanceOf()
    function balanceOf(address) external pure returns (uint256) {
        return 0;
    }

    // Used via IAeroPool(AERO_POOL)
    function getReserves()
        external
        view
        returns (uint256 reserve0, uint256 reserve1, uint32 blockTimestampLast)
    {
        return (0, 0, 0);
    }

    function token0() external view returns (address) {
        return address(0);
    }

    function token1() external view returns (address) {
        return address(0);
    }

    function totalSupply() external view returns (uint256) {
        return 0;
    }
}

contract StubGauge {
    function balanceOf(address) external pure returns (uint256) {
        return 0;
    }

    function deposit(uint256) external {}

    function withdraw(uint256) external {}

    function getReward() external {}
}

// Real constant addresses from the vault (Base mainnet)
address constant REAL_AERO_POOL  = 0x2De3fE21d32319a1550264dA37846737885Ad7A1;
address constant REAL_AERO_GAUGE = 0x7fDCBc8C442C667D41a1041bdc6e588393cEb6fe;

// ---------------------------------------------------------------------
// Main test
// ---------------------------------------------------------------------
contract GranBoldUsdcVaultFeesTest is Test {
    GranBoldUsdcVault public vault;
    MockUSDC public usdc;

    address public owner = address(this);
    address public feeRecipient = address(0xFEE1);
    address public user = address(0xBEEF);

    uint256 public constant ONE_USDC = 1e6; // 6 decimals

    function setUp() public {
        // 1) Stub pool & gauge bytecode into the real addresses used by the vault
        StubAeroPool poolImpl = new StubAeroPool();
        StubGauge gaugeImpl = new StubGauge();

        // Overwrite code at the real addresses so calls don't revert
        vm.etch(REAL_AERO_POOL, address(poolImpl).code);
        vm.etch(REAL_AERO_GAUGE, address(gaugeImpl).code);

        // 2) Mock USDC
        usdc = new MockUSDC();

        // 3) Deploy vault
        uint256 maxDepositPerTx = type(uint256).max;
        uint256 maxWithdrawPerTx = type(uint256).max;
        uint256 minDeposit = ONE_USDC; // 1 USDC

        vault = new GranBoldUsdcVault(
            address(usdc),
            owner,
            feeRecipient,
            maxDepositPerTx,
            maxWithdrawPerTx,
            minDeposit
        );
        // idleBuffer starts at 0 by default -> ok for tests
    }

    // Helper: deposit for a user
    function _deposit(address _user, uint256 amount) internal returns (uint256 sharesMinted) {
        usdc.mint(_user, amount);
        vm.startPrank(_user);
        usdc.approve(address(vault), amount);
        sharesMinted = vault.deposit(amount);
        vm.stopPrank();
    }

    // ------------------------------------------------------------
    // 1) First deposit: 1:1 shares and principal
    // ------------------------------------------------------------
    function testFirstDeposit_Mints1to1SharesAndTracksPrincipal() public {
        uint256 amount = 1_000 * ONE_USDC; // 1,000 USDC

        uint256 sharesMinted = _deposit(user, amount);

        assertEq(sharesMinted, amount, "Shares should equal assets on first deposit");
        assertEq(vault.totalShares(), amount, "Total shares mismatch");
        assertEq(vault.shares(user), amount, "User shares mismatch");
        assertEq(vault.userPrincipal(user), amount, "User principal mismatch");
        assertEq(vault.totalAssets(), amount, "Total assets should equal deposit");
    }

    // ------------------------------------------------------------
    // 2) Withdraw: charge 0.3% on TOTAL and send fee to feeRecipient
    // ------------------------------------------------------------
    function testWithdraw_Charges0_3PercentOnTotalAndSendsFee() public {
        uint256 amount = 1_000 * ONE_USDC; // 1,000 USDC

        _deposit(user, amount);

        uint256 totalBefore = vault.totalAssets();
        assertEq(totalBefore, amount, "Total assets should equal deposit before withdraw");

        uint256 userShares = vault.shares(user);
        assertEq(userShares, amount, "User should own 100% of shares");

        // Economics
        uint256 grossAssets = totalBefore; // user owns 100% of TVL
        uint256 expectedFee = (grossAssets * 30) / 10_000; // 0.3%
        uint256 expectedNet = grossAssets - expectedFee;

        // Withdraw all shares
        vm.startPrank(user);
        uint256 received = vault.withdraw(
            userShares,
            expectedNet,             // minNetAssetsOut
            0,                       // minUsdcFromDivest (no divest needed in this test)
            block.timestamp + 1 days // deadline
        );
        vm.stopPrank();

        assertEq(received, expectedNet, "User net received mismatch");
        assertEq(usdc.balanceOf(user), expectedNet, "User USDC balance mismatch");
        assertEq(usdc.balanceOf(feeRecipient), expectedFee, "Fee recipient balance mismatch");

        assertEq(vault.totalShares(), 0, "All shares should be burned");
        assertEq(vault.shares(user), 0, "User shares should be zero");
        assertEq(vault.userPrincipal(user), 0, "User principal should be zero on full withdraw");
        assertEq(vault.totalAssets(), 0, "Vault should have no assets left");
    }

    // ------------------------------------------------------------
    // 3) Harvest: charge 0.3% ONLY on profit, don't burn shares
    // ------------------------------------------------------------
    function testHarvest_Charges0_3PercentOnProfitOnly_NoShareBurn() public {
        uint256 depositAmount = 1_000 * ONE_USDC; // 1,000 USDC
        _deposit(user, depositAmount);

        // Simulate profit: yield comes into the vault as extra USDC
        uint256 profitAmount = 100 * ONE_USDC; // +100 USDC
        usdc.mint(address(vault), profitAmount);

        uint256 totalBefore = vault.totalAssets(); // 1,100 USDC
        assertEq(totalBefore, depositAmount + profitAmount, "Total assets mismatch after profit");

        uint256 userSharesBefore = vault.shares(user);
        uint256 principalBefore = vault.userPrincipal(user);
        uint256 vaultBalanceBefore = usdc.balanceOf(address(vault));
        uint256 feeRecipientBefore = usdc.balanceOf(feeRecipient);
        uint256 userBalanceBefore = usdc.balanceOf(user);

        // Expected profit and fee
        uint256 expectedProfit = profitAmount; // user owns 100% of shares
        uint256 expectedFee = (expectedProfit * 30) / 10_000; // 0.3%
        uint256 expectedNet = expectedProfit - expectedFee;

        // Harvest
        vm.startPrank(user);
        uint256 netPayout = vault.harvest(
            0,                        // minNetProfitOut (for this test, accept any)
            0,                        // minUsdcFromDivest
            block.timestamp + 1 days  // deadline
        );
        vm.stopPrank();

        // Economics checks
        assertEq(netPayout, expectedNet, "Net harvest payout mismatch");
        assertEq(
            usdc.balanceOf(user) - userBalanceBefore,
            expectedNet,
            "User harvest balance delta mismatch"
        );
        assertEq(
            usdc.balanceOf(feeRecipient) - feeRecipientBefore,
            expectedFee,
            "Fee recipient delta mismatch"
        );

        // Vault must have lost exactly "profitAmount" (fee + netPayout)
        uint256 vaultBalanceAfter = usdc.balanceOf(address(vault));
        assertEq(
            vaultBalanceBefore - vaultBalanceAfter,
            expectedProfit,
            "Vault should lose exactly profit amount"
        );

        // Shares DO NOT change on harvest
        assertEq(vault.shares(user), userSharesBefore, "User shares should not change on harvest");

        // Principal stays equal to original deposit (harvest = withdraw profit, not capital)
        assertEq(
            vault.userPrincipal(user),
            principalBefore,
            "User principal should stay equal to original deposit after harvest"
        );

        // TVL returns to original principal (1000 USDC)
        assertEq(vault.totalAssets(), depositAmount, "Total assets should equal original principal after harvest");
    }

    // ------------------------------------------------------------
    // 4) Compound: updates principal, moves no tokens, no fee
    // ------------------------------------------------------------
    function testCompound_UpdatesPrincipalWithoutMovingFundsOrFees() public {
        uint256 depositAmount = 1_000 * ONE_USDC; // 1,000 USDC
        _deposit(user, depositAmount);

        // Simulate profit
        uint256 profitAmount = 100 * ONE_USDC; // +100 USDC
        usdc.mint(address(vault), profitAmount);

        uint256 totalBefore = vault.totalAssets(); // 1,100
        uint256 userValueBefore = vault.userValue(user); // should be 1,100
        uint256 principalBefore = vault.userPrincipal(user); // 1,000
        uint256 vaultBalanceBefore = usdc.balanceOf(address(vault));
        uint256 userBalanceBefore = usdc.balanceOf(user);
        uint256 feeRecipientBefore = usdc.balanceOf(feeRecipient);
        uint256 userSharesBefore = vault.shares(user);

        assertEq(userValueBefore, totalBefore, "User should own 100% of vault");

        // Compound
        vm.prank(user);
        vault.compound();

        // No tokens should move
        assertEq(usdc.balanceOf(address(vault)), vaultBalanceBefore, "Vault balance should not change");
        assertEq(usdc.balanceOf(user), userBalanceBefore, "User balance should not change");
        assertEq(usdc.balanceOf(feeRecipient), feeRecipientBefore, "Fee recipient balance should not change");

        // Shares stay the same
        assertEq(vault.shares(user), userSharesBefore, "User shares should not change");

        // Principal is bumped to current user value (locking profit as new principal)
        uint256 principalAfter = vault.userPrincipal(user);
        assertEq(principalAfter, userValueBefore, "Principal should be bumped to current value on compound");
        assertGt(principalAfter, principalBefore, "Principal should increase after compound");

        // TVL remains unchanged
        assertEq(vault.totalAssets(), totalBefore, "Total assets should not change");
    }
}
