import { ethers } from "hardhat";

async function main() {
  const VAULT     = process.env.VAULT!;
  const TIMELOCK  = process.env.TIMELOCK!;    // timelock dueño actual (el que hizo el schedule)
  const NEW_OWNER = process.env.NEW_OWNER!;   // timelock nuevo (destino)
  const SALT_TXT  = process.env.SALT!;        // el mismo SALT del schedule

  const v  = await ethers.getContractAt("EverestVault", VAULT);
  const tl = await ethers.getContractAt("GE_Timelock", TIMELOCK);

  const data = v.interface.encodeFunctionData("transferOwnership", [NEW_OWNER]);
  const predecessor = ethers.ZeroHash;
  const salt = ethers.id(SALT_TXT);

  const opId = await (tl as any).hashOperation(VAULT, 0, data, predecessor, salt);
  const pending = await (tl as any).isOperationPending(opId);
  const ready   = await (tl as any).isOperationReady(opId);
  const done    = await (tl as any).isOperationDone(opId);

  console.log({ opId, pending, ready, done });

  try {
    const ts = await (tl as any).getTimestamp(opId);
    console.log("eta (unix):", ts.toString());
  } catch {
    // algunos builds no exponen getTimestamp
  }
}

main().catch((e)=>{ console.error(e); process.exit(1); });
