import { ethers } from "hardhat";

async function main() {
  const addr = process.env.VAULT_ADDRESS!;
  if (!addr) throw new Error("Set VAULT_ADDRESS env var");

  const [signer] = await ethers.getSigners();
  const vault = await ethers.getContractAt("EverestVault", addr, signer);

  const tx = await vault.unpause();
  console.log("Unpausing...");
  await tx.wait();
  console.log("Unpaused");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
