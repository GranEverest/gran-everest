import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const feeRecipient =
    process.env.FEE_RECIPIENT && process.env.FEE_RECIPIENT !== ""
      ? process.env.FEE_RECIPIENT
      : deployer.address;

  console.log("Deployer:", deployer.address);
  console.log("Fee Recipient:", feeRecipient);

  const Vault = await ethers.getContractFactory("EverestVault");
  const vault = await Vault.deploy(feeRecipient);
  await vault.waitForDeployment();

  console.log("EverestVault deployed at:", await vault.getAddress());
}
main().catch((e) => { console.error(e); process.exit(1); });
