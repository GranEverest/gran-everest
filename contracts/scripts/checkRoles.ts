// scripts/checkRoles.ts
import { ethers } from "hardhat";

async function main() {
  const addr = (process.env.VAULT_ADDRESS || process.argv[2]) as `0x${string}` | undefined;
  if (!addr) {
    console.error("Usage: VAULT_ADDRESS=<addr> npx hardhat run scripts/checkRoles.ts --network base");
    console.error("   or: npx hardhat run scripts/checkRoles.ts --network base <addr>");
    process.exit(1);
  }

  const net = await ethers.provider.getNetwork();
  console.log(`Network = ${net.name} (${net.chainId})`);
  console.log(`Vault   = ${addr}`);

  try {
    const vault = await ethers.getContractAt("EverestVault", addr);
    const [owner, guardian, feeRecv, paused] = await Promise.all([
      vault.owner(),
      (vault as any).guardian(),     // cast por si el tipado no expone guardian()
      (vault as any).feeRecipient(), // idem
      vault.paused(),
    ]);

    console.log(`owner    = ${owner}`);
    console.log(`guardian = ${guardian}`);
    console.log(`feeRecv  = ${feeRecv}`);
    console.log(`paused   = ${paused}`);
  } catch (err: any) {
    console.error("\n❌ No se pudo leer el contrato.");
    console.error("   Causas típicas: red equivocada, dirección mal, o no hay contrato en esa dirección.");
    console.error(`   Detalle: ${err?.shortMessage || err?.message || err}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
