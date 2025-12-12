// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {console2} from "forge-std/console2.sol";
import {Script} from "forge-std/Script.sol";
import {GranBoldUsdcVault} from "../src/GranBoldUsdcVault.sol";

contract DeployGranBoldUsdcVault is Script {
    // Configurable settings from command line
    uint256 public constant GAS_LIMIT = 12_000_000; // 12M gas for deployment
    uint256 public constant GAS_PRICE = 2 gwei;     // 2 gwei base, can be overridden
    
    function run() external {
        // ===== CONFIGURATION =====
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address owner = vm.envAddress("VAULT_OWNER");
        address feeRecipient = vm.envAddress("FEE_RECIPIENT");
        address usdc = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
        
        // Critical validations
        require(owner != address(0), "Owner cannot be zero address");
        require(feeRecipient != address(0), "Fee recipient cannot be zero address");
        require(usdc != address(0), "USDC address cannot be zero");
        
        // Parameter configuration
        uint16 performanceFeeBps = 200;                // 2% performance fee
        uint256 maxDepositPerTx = 5_000_000 * 1e6;     // 5M USDC per deposit
        uint256 maxWithdrawPerTx = 2_000_000 * 1e6;    // 2M USDC per withdraw
        uint256 minDeposit = 1 * 1e6;                  // 1 USDC
        
        // ===== CONFIGURATION LOGS =====
        console2.log("========================================");
        console2.log("GranBold USDC Vault - Base Mainnet Deployment");
        console2.log("========================================");
        console2.log("Configuration:");
        console2.log("  USDC Address:     ", usdc);
        console2.log("  Owner:            ", owner);
        console2.log("  Fee Recipient:    ", feeRecipient);
        console2.log("  Performance Fee (bps): ", performanceFeeBps);
        console2.log("  Performance Fee (%):   ", performanceFeeBps / 100);
        console2.log("  Max Deposit/TX (USDC):   ", maxDepositPerTx / 1e6);
        console2.log("  Max Withdraw/TX (USDC):  ", maxWithdrawPerTx / 1e6);
        console2.log("  Min Deposit (USDC):      ", minDeposit / 1e6);
        
        // Verify deployer has funds
        address deployer = vm.addr(pk);
        uint256 deployerBalance = deployer.balance;
        console2.log("\nDeployer Info:");
        console2.log("  Address: ", deployer);
        console2.log("  Balance (ETH): ", deployerBalance / 1e18);
        
        if (deployerBalance < 0.05 ether) {
            console2.log("WARNING: Deployer balance may be insufficient for gas!");
        }
        
        // ===== DEPLOYMENT =====
        console2.log("\nDeploying contract...");
        
        uint256 gasBefore = gasleft();
        
        // Use try-catch to handle deployment errors
        try this.deployVault(
            pk,
            usdc,
            owner,
            feeRecipient,
            performanceFeeBps,
            maxDepositPerTx,
            maxWithdrawPerTx,
            minDeposit
        ) returns (address vaultAddress) {
            
            uint256 gasUsed = gasBefore - gasleft();
            
            console2.log("\nSUCCESS: Vault deployed!");
            console2.log("Contract Address: ", vaultAddress);
            console2.log("Gas Used:        ", gasUsed);
            console2.log("Code Size (bytes): ", address(vaultAddress).code.length);
            
            // Verify contract is deployed correctly
            if (address(vaultAddress).code.length == 0) {
                revert("Contract deployment failed - no code at address");
            }
            
            // ===== POST-DEPLOYMENT VERIFICATIONS =====
            console2.log("\nPost-deployment verification:");
            
            // Use success to not revert entire transaction if one verification fails
            bool success;
            bytes memory data;
            
            // Verify owner
            (success, data) = vaultAddress.staticcall(abi.encodeWithSignature("owner()"));
            if (success) {
                address actualOwner = abi.decode(data, (address));
                console2.log("  Owner:          ", actualOwner);
                require(actualOwner == owner, "Owner mismatch!");
            }
            
            // Verify fee recipient
            (success, data) = vaultAddress.staticcall(abi.encodeWithSignature("feeRecipient()"));
            if (success) {
                address actualFeeRecipient = abi.decode(data, (address));
                console2.log("  Fee Recipient:  ", actualFeeRecipient);
            }
            
            // Verify performance fee
            (success, data) = vaultAddress.staticcall(abi.encodeWithSignature("performanceFeeBps()"));
            if (success) {
                uint16 actualFee = abi.decode(data, (uint16));
                console2.log("  Performance Fee:", actualFee, " bps");
                require(actualFee == performanceFeeBps, "Performance fee mismatch!");
            }
            
            // Verify USDC address
            (success, data) = vaultAddress.staticcall(abi.encodeWithSignature("usdc()"));
            if (success) {
                address actualUsdc = abi.decode(data, (address));
                console2.log("  USDC Address:   ", actualUsdc);
                require(actualUsdc == usdc, "USDC address mismatch!");
            }
            
            // ===== GENERATE VERIFICATION COMMANDS =====
            console2.log("\nVerification command:");
            string memory verifyCmd = string(
                abi.encodePacked(
                    "forge verify-contract ",
                    vm.toString(vaultAddress),
                    " src/GranBoldUsdcVault.sol:GranBoldUsdcVault --chain-id 8453 --etherscan-api-key $ETHERSCAN_API_KEY --constructor-args $(cast abi-encode \"constructor(address,address,address,uint16,uint256,uint256,uint256)\" ",
                    vm.toString(usdc),
                    " ",
                    vm.toString(owner),
                    " ",
                    vm.toString(feeRecipient),
                    " ",
                    vm.toString(performanceFeeBps),
                    " ",
                    vm.toString(maxDepositPerTx),
                    " ",
                    vm.toString(maxWithdrawPerTx),
                    " ",
                    vm.toString(minDeposit),
                    ")"
                )
            );
            
            console2.log(verifyCmd);
            
            // ===== POST-DEPLOYMENT INSTRUCTIONS =====
            console2.log("\nNext steps:");
            console2.log("  1. Verify contract on Basescan using the command above");
            console2.log("  2. Set idle buffer: vault.setIdleBuffer(50000000000) // 50k USDC");
            console2.log("  3. Test deposit/withdraw with small amounts");
            console2.log("  4. Consider transferring ownership to multisig");
            console2.log("\nBasescan URL:");
            console2.log("  https://basescan.org/address/", vaultAddress);
            console2.log("========================================");
            
        } catch Error(string memory reason) {
            console2.log("\nDeployment failed with error:");
            console2.log("  ", reason);
            revert(string(abi.encodePacked("Deployment failed: ", reason)));
        } catch (bytes memory lowLevelData) {
            console2.log("\nDeployment failed with low-level error");
            if (lowLevelData.length > 0) {
                console2.logBytes(lowLevelData);
            }
            revert("Deployment failed with low-level error");
        }
    }
    
    // Separate function for deployment that can be called with try-catch
    function deployVault(
        uint256 pk,
        address usdc,
        address owner,
        address feeRecipient,
        uint16 performanceFeeBps,
        uint256 maxDepositPerTx,
        uint256 maxWithdrawPerTx,
        uint256 minDeposit
    ) external returns (address) {
        // Only main script can call this function
        require(msg.sender == address(this), "Only callable from main script");
        
        vm.startBroadcast(pk);
        
        GranBoldUsdcVault vault = new GranBoldUsdcVault(
            usdc,
            owner,
            feeRecipient,
            performanceFeeBps,
            maxDepositPerTx,
            maxWithdrawPerTx,
            minDeposit
        );
        
        vm.stopBroadcast();
        
        return address(vault);
    }
}
