import { ethers } from "hardhat";

async function main() {
  const VAULT     = process.env.VAULT!;
  const TIMELOCK  = process.env.TIMELOCK!;   // Timelock DUEÑO actual (el que tiene owner() hoy)
  const NEW_OWNER = process.env.NEW_OWNER!;  // Timelock nuevo (al que querés pasar la propiedad)
  const SALT_TXT  = process.env.SALT || "GE_OWNER_TO_TL_V1";
  const DELAY_ENV = process.env.DELAY;       // opcional: forzar delay por env

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

  // data a programar: transferOwnership(NEW_OWNER)
  const data = v.interface.encodeFunctionData("transferOwnership", [NEW_OWNER]);
  const predecessor = ethers.ZeroHash;
  const salt = ethers.id(SALT_TXT);

  // delay a usar: por defecto el minDelay on-chain, o DELAY si lo pasás por env
  let minDelay: bigint;
  try {
    minDelay = await (tl as any).getMinDelay();
    console.log("MinDelay (timelock):", minDelay.toString(), "sec");
  } catch {
    throw new Error("Este Timelock no expone getMinDelay(); no podemos calcular el delay.");
  }
  const delay = DELAY_ENV ? BigInt(DELAY_ENV) : minDelay;

  if (delay < minDelay) {
    throw new Error(`Delay provisto (${delay}s) < minDelay (${minDelay}s): aumentalo o no pases DELAY.`);
  }

  const tx = await tl.schedule(VAULT, 0, data, predecessor, salt, delay);
  console.log("schedule tx:", tx.hash);
  await tx.wait();

  const opId = await (tl as any).hashOperation(VAULT, 0, data, predecessor, salt);
  console.log("✅ Scheduled transferOwnership. opId:", opId, "delay:", delay.toString(), "sec");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
