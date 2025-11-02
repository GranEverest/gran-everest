// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
 * MockToken (para pruebas locales/testnet)
 * - ERC20 simple con mint del owner
 * - NO se usa en producción del Vault (que es ETH-only)
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockToken is ERC20, Ownable {
    constructor() ERC20("MockToken", "MOCK") {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
