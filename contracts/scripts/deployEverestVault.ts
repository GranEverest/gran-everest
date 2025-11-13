import { ethers } from "hardhat";

async function main() {
  const [deployer, maybeTreasury] = await ethers.getSigners();

  const feeRecipient = process.env.FEE_RECIPIENT ?? maybeTreasury.address;
  console.log("Deployer:", deployer.address);
  console.log("Fee recipient:", feeRecipient);

  const Factory = await ethers.getContractFactory("EverestVault");
  const vault = await Factory.deploy(feeRecipient);
  await vault.waitForDeployment();

  console.log("EverestVault deployed to:", await vault.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
