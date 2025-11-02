import { ethers } from "hardhat";

async function main() {
  const VAULT     = process.env.VAULT!;
  const TIMELOCK  = process.env.TIMELOCK!;   // Mismo timelock que programó (dueño actual)
  const NEW_OWNER = process.env.NEW_OWNER!;
  const SALT_TXT  = process.env.SALT || "GE_OWNER_TO_TL_V1";

  if (!VAULT || !TIMELOCK || !NEW_OWNER) {
    throw new Error("Set envs: VAULT, TIMELOCK, NEW_OWNER (and SALT opcional)");
  }

  const [signer] = await ethers.getSigners();
  console.log("Signer:", await signer.getAddress());
  console.log("Vault:", VAULT);
  console.log("Timelock (owner actual):", TIMELOCK);
  console.log("Nuevo owner:", NEW_OWNER);
  console.log("SALT text:", SALT_TXT);

  const v  = await ethers.getContractAt("EverestVault", VAULT);
  const tl = await ethers.getContractAt("GE_Timelock", TIMELOCK);

  const data = v.interface.encodeFunctionData("transferOwnership", [NEW_OWNER]);
  const predecessor = ethers.ZeroHash;
  const salt = ethers.id(SALT_TXT);

  // Ejecuta (fallará con: "operation is not ready" si no pasó el delay)
  const tx = await tl.execute(VAULT, 0, data, predecessor, salt);
  console.log("execute tx:", tx.hash);
  await tx.wait();

  console.log("✅ Executed transferOwnership");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
