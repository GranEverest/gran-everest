import { ethers } from "hardhat";

async function main() {
  // Dirección del EverestVaultMulti en Base mainnet
  const vaultAddress = "0x8A83E4349f4bd053cef3083F4219628957f54725";

  const [signer] = await ethers.getSigners();
  console.log("Using signer:", signer.address);

  const vault = await ethers.getContractAt("EverestVaultMulti", vaultAddress);

  const owner = await vault.owner();
  const feeRecipient = await vault.feeRecipient();
  const totalCollateral = await vault.totalCollateral();
  const totalDebt = await vault.totalDebt();

  console.log("EverestVaultMulti address:", vaultAddress);
  console.log("Owner:", owner);
  console.log("Fee recipient:", feeRecipient);
  console.log("Total collateral (wei):", totalCollateral.toString());
  console.log("Total debt (wei):", totalDebt.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
