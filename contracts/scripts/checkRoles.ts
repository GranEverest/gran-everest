import { ethers } from "hardhat";

async function main() {
  const VAULT = process.argv[2] || process.env.VAULT;
  if (!VAULT) {
    throw new Error("Uso: npx hardhat run scripts/checkRoles.ts --network base -- <VAULT>");
  }

  const v = await ethers.getContractAt("EverestVault", VAULT);
  console.log("Vault    =", VAULT);
  console.log("owner    =", await v.owner());
  console.log("guardian =", await v.guardian());
  console.log("feeRecv  =", await v.feeRecipient());
  console.log("paused   =", await v.paused());
}

main().catch((e) => { console.error(e); process.exit(1); });
