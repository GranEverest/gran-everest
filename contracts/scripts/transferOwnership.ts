import { ethers } from "hardhat";

async function main() {
  const VAULT = process.env.VAULT!;
  const NEW_OWNER = process.env.OWNER!;
  if (!VAULT || !NEW_OWNER) throw new Error("Set env: VAULT and OWNER");

  const [signer] = await ethers.getSigners();
  console.log("Admin:", await signer.getAddress());
  console.log("Vault:", VAULT);
  console.log("New owner:", NEW_OWNER);

  const v = await ethers.getContractAt("EverestVault", VAULT, signer);
  const tx = await v.transferOwnership(NEW_OWNER);
  console.log("tx:", tx.hash);
  await tx.wait();
  console.log("✅ Ownership transferred");
}

main().catch((e)=>{ console.error(e); process.exit(1); });
