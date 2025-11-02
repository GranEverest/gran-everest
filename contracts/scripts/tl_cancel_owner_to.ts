import { ethers } from "hardhat";

async function main() {
  const VAULT    = process.env.VAULT!;
  const TIMELOCK = process.env.TIMELOCK!;      // timelock donde programaste
  const NEW_OWNER= process.env.NEW_OWNER!;     // EL OWNER EQUIVOCADO (0xcE3E…)
  const SALTSTR  = process.env.SALT || "GE_CAPS_V2_60S";

  if (!VAULT || !TIMELOCK || !NEW_OWNER) throw new Error("Missing VAULT/TIMELOCK/NEW_OWNER");

  const v  = await ethers.getContractAt("EverestVault", VAULT);
  const tl = await ethers.getContractAt("GE_Timelock", TIMELOCK);

  const data = v.interface.encodeFunctionData("transferOwnership", [NEW_OWNER]);
  const op   = await tl.hashOperation(VAULT, 0, data, ethers.ZeroHash, ethers.id(SALTSTR));

  const pending = await tl.isOperationPending(op);
  console.log("pending:", pending);
  if (!pending) { console.log("Nada que cancelar."); return; }

  const tx = await tl.cancel(op);
  console.log("cancel tx:", tx.hash);
  await tx.wait();
  console.log("✅ Cancelled transferOwnership →", NEW_OWNER);
}

main().catch((e)=>{ console.error(e); process.exit(1); });
