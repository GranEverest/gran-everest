// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IEverest {
    function deposit() external payable;
    function borrow(uint256 amount) external;
}

contract LoopSameBlock {
    // Deposita para que este contrato tenga colateral propio en el Vault
    function depositTo(address payable vault) external payable {
        IEverest(vault).deposit{value: msg.value}();
    }

    // Intenta borrow y luego depositar en el MISMO bloque (debe revertir por anti-loop)
    function borrowThenDeposit(address payable vault, uint256 amount) external {
        IEverest v = IEverest(vault);
        v.borrow(amount);
        v.deposit{value: amount}();
    }

    receive() external payable {}
}
