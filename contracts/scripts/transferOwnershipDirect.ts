import { ethers } from "hardhat";

async function main() {
  const VAULT = process.env.VAULT!;
  const NEW_OWNER = process.env.OWNER!;
  if (!VAULT || !NEW_OWNER) {
    throw new Error("Set env: VAULT and OWNER (0x...)");
  }

  const [signer] = await ethers.getSigners();
  console.log("Admin (signer):", await signer.getAddress());
  console.log("Vault:", VAULT);
  console.log("New owner:", NEW_OWNER);

  const vault = await ethers.getContractAt("EverestVault", VAULT, signer);

  // Transferencia DIRECTA (no timelock)
  const tx = await vault.transferOwnership(NEW_OWNER);
  console.log("tx:", tx.hash);
  await tx.wait();
  console.log("✅ Ownership transferred");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
