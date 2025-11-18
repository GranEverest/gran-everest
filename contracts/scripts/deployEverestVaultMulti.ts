import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deployer:", deployer.address);

  const feeRecipient = process.env.FEE_RECIPIENT;
  if (!feeRecipient) {
    throw new Error("FEE_RECIPIENT env var is not set");
  }
  if (!ethers.isAddress(feeRecipient)) {
    throw new Error("FEE_RECIPIENT is not a valid address");
  }

  console.log("Fee recipient:", feeRecipient);

  const EverestVaultMulti = await ethers.getContractFactory("EverestVaultMulti");
  const vault = await EverestVaultMulti.deploy(feeRecipient);

  console.log("Deploy tx sent. Waiting for confirmation...");
  const receipt = await vault.deploymentTransaction()?.wait();

  const address = await vault.getAddress();
  console.log("EverestVaultMulti deployed at:", address);
  console.log("Tx hash:", receipt?.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
