// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/EverestVaultMulti.sol";

contract EverestVaultMultiFuzz is Test {
    EverestVaultMulti vault;
    address user = address(0x1234);
    address feeRecipient = address(0xBEEF);

    function setUp() public {
        // give user some ETH to play with
        vm.deal(user, 1_000 ether);

        // deploy vault
        vault = new EverestVaultMulti(feeRecipient);

        // create vaultId = 0
        vm.prank(user);
        vault.createVault();
    }

    /// -----------------------------------------------------------------------
    /// 1) ETH is not lost (simple flows)
    /// -----------------------------------------------------------------------

    // Deposit + withdraw full collateral => total ETH (user + vault + feeRecipient) is conserved
    function testFuzz_DepositWithdraw_ConservesEth(uint96 depositAmount) public {
        vm.assume(depositAmount > 0 && depositAmount < 100 ether);

        uint256 beforeTotal =
            user.balance +
            address(vault).balance +
            feeRecipient.balance;

        // Deposit into vault 0
        vm.prank(user);
        vault.deposit{value: depositAmount}(0);

        // Withdraw ALL collateral from vault 0
        (uint256 collateral, ) = vault.getVault(user, 0);
        vm.prank(user);
        vault.withdraw(0, collateral);

        uint256 afterTotal =
            user.balance +
            address(vault).balance +
            feeRecipient.balance;

        assertEq(beforeTotal, afterTotal, "ETH must be conserved (deposit+withdraw)");
    }

    // Deposit + borrow + repay => total ETH (user + vault + feeRecipient) is conserved
    function testFuzz_DepositBorrowRepay_ConservesEth(
        uint96 depositAmount,
        uint96 borrowAmount
    ) public {
        vm.assume(depositAmount > 0 && depositAmount < 100 ether);

        uint256 beforeTotal =
            user.balance +
            address(vault).balance +
            feeRecipient.balance;

        // Deposit
        vm.prank(user);
        vault.deposit{value: depositAmount}(0);

        // Compute safe max borrow for vault 0
        (uint256 collateral, uint256 debt) = vault.getVault(user, 0);
        uint256 maxBorrow = vault.maxBorrowable(collateral);
        vm.assume(borrowAmount > 0 && borrowAmount <= maxBorrow);

        // Borrow
        vm.prank(user);
        vault.borrow(0, borrowAmount);

        // Repay full debt
        vm.prank(user);
        vault.repay{value: borrowAmount}(0);

        uint256 afterTotal =
            user.balance +
            address(vault).balance +
            feeRecipient.balance;

        assertEq(beforeTotal, afterTotal, "ETH must be conserved (deposit+borrow+repay)");
    }

    /// -----------------------------------------------------------------------
    /// 2) Debt never below 0
    /// -----------------------------------------------------------------------
    /// In Solidity 0.8+ with uint256, debt < 0 is impossible (underflow reverts).
    /// This test just exercises borrow/repay with fuzzed values.

    function testFuzz_DebtNeverNegative(
        uint96 depositAmount,
        uint96 borrowAmount,
        uint96 repayAmount
    ) public {
        vm.assume(depositAmount > 0 && depositAmount < 100 ether);

        vm.prank(user);
        vault.deposit{value: depositAmount}(0);

        (uint256 collateral, uint256 d0) = vault.getVault(user, 0);
        uint256 maxBorrow = vault.maxBorrowable(collateral);
        vm.assume(borrowAmount > 0 && borrowAmount <= maxBorrow);

        // borrow
        vm.prank(user);
        vault.borrow(0, borrowAmount);

        // choose some repayAmount (0 .. borrowAmount * 2)
        vm.assume(repayAmount > 0 && repayAmount < borrowAmount * 2);

        vm.prank(user);
        vault.repay{value: repayAmount}(0);

        (, uint256 dFinal) = vault.getVault(user, 0);

        // this is mostly documenting the invariant; if it ever underflowed, tx would revert
        assertGe(dFinal, 0, "Debt must never be negative");
    }

    /// -----------------------------------------------------------------------
    /// 3) LTV <= 70% after valid operations
    /// -----------------------------------------------------------------------

    function testFuzz_LTVNeverAbove70(
        uint96 depositAmount,
        uint96 borrowAmount
    ) public {
        vm.assume(depositAmount > 0 && depositAmount < 100 ether);

        // Deposit
        vm.prank(user);
        vault.deposit{value: depositAmount}(0);

        (uint256 collateral, uint256 currDebt) = vault.getVault(user, 0);
        uint256 maxBorrow = vault.maxBorrowable(collateral);
        vm.assume(borrowAmount > 0 && borrowAmount <= maxBorrow);

        // Borrow (this should respect the LTV check)
        vm.prank(user);
        vault.borrow(0, borrowAmount);

        (collateral, currDebt) = vault.getVault(user, 0);

        // Check LTV: debt * 10000 <= collateral * MAX_LTV_BPS
        uint256 maxLtvBps = vault.MAX_LTV_BPS();
        assertLe(currDebt * 10000, collateral * maxLtvBps, "LTV must stay <= 70%");
    }
}
