// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IEverestVaultMulti {
    function borrow(uint256 vaultId, uint256 amount) external;
    function deposit(uint256 vaultId) external payable;
}

contract LoopTester {
    IEverestVaultMulti public vault;

    constructor(address _vault) {
        vault = IEverestVaultMulti(_vault);
    }

    // Test Borrow+Deposit in the same tx/block -> must revert
    function testBorrowThenDeposit(uint256 vaultId, uint256 amount) external payable {
        // assumes caller has already set up collateral in this vault before
        vault.borrow(vaultId, amount);
        vault.deposit{value: amount}(vaultId);
    }

    // Test Borrow twice in the same tx/block -> must revert
    function testDoubleBorrow(uint256 vaultId, uint256 amount1, uint256 amount2) external {
        vault.borrow(vaultId, amount1);
        vault.borrow(vaultId, amount2);
    }
}
