// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IEverest {
    function deposit() external payable;
    function borrow(uint256 amount) external;
}

contract LoopSameBlock {
    function depositTo(address payable vault) external payable {
        IEverest(vault).deposit{value: msg.value}();
    }

    function borrowThenDeposit(address payable vault, uint256 amount) external {
        IEverest v = IEverest(vault);
        v.borrow(amount);
        v.deposit{value: amount}();
    }

    receive() external payable {}
}
