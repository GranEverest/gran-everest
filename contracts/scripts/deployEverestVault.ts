import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  const feeRecipient = process.env.FEE_RECIPIENT;
  if (!feeRecipient) throw new Error("Falta FEE_RECIPIENT en .env");

  console.log("Deploying EverestVault on Base…");
  console.log("feeRecipient:", feeRecipient);

  const Vault = await ethers.getContractFactory("EverestVault");
  const vault = await Vault.deploy(feeRecipient); // <-- PASA EL ARGUMENTO
  await vault.waitForDeployment();

  const address = await vault.getAddress();
  console.log("EverestVault deployed at:", address);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
