import { ethers } from "hardhat";

async function main() {
  const VAULT   = process.env.VAULT!;
  const TL_ADDR = process.env.TIMELOCK!;     // timelock desde el que querés cancelar
  const SALT    = ethers.id(process.env.SALT || "GE_SET_CAPS_V1");

  const v  = await ethers.getContractAt("EverestVault", VAULT);
  const tl = await ethers.getContractAt("GE_Timelock", TL_ADDR);

  // calcular operaciones que solemos usar
  const dataCaps = v.interface.encodeFunctionData("setCaps", [
    ethers.parseEther(process.env.CAP_COLLATERAL_ETH || "100"),
    ethers.parseEther(process.env.CAP_DEBT_ETH       || "70"),
  ]);
  const dataOwnerToTL = v.interface.encodeFunctionData("transferOwnership", [TL_ADDR]);

  const opCaps  = await tl.hashOperation(VAULT, 0, dataCaps, ethers.ZeroHash, SALT);
  const opOwner = await tl.hashOperation(VAULT, 0, dataOwnerToTL, ethers.ZeroHash, SALT);

  for (const [label, op] of [["caps", opCaps], ["owner", opOwner]] as const) {
    try {
      const pend = await tl.isOperationPending(op);
      if (!pend) { console.log(`- ${label}: no pending (nada que cancelar)`); continue; }
      const tx = await tl.cancel(op);
      await tx.wait();
      console.log(`✅ cancel ${label}:`, tx.hash);
    } catch (e) {
      console.log(`(skip) ${label}:`, (e as any)?.reason || (e as any)?.message || e);
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
