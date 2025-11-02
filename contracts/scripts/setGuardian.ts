import { ethers } from "hardhat";

async function main() {
  // admite argv o variables de entorno
  const [a1, a2] = process.argv.slice(2);
  const vaultAddr = a1 || process.env.VAULT;
  const guardianAddr = a2 || process.env.GUARDIAN;
  if (!vaultAddr || !guardianAddr) {
    throw new Error(
      "Missing params. Use either:\n" +
      "  npx hardhat run scripts/setGuardian.ts --network <net> <VAULT> <GUARDIAN>\n" +
      "or set env vars:\n" +
      "  VAULT=0x... GUARDIAN=0x... npx hardhat run scripts/setGuardian.ts --network <net>"
    );
  }

  const [admin] = await ethers.getSigners();
  console.log("Admin:", admin.address);
  console.log("Vault:", vaultAddr);
  console.log("New guardian:", guardianAddr);

  const c = await ethers.getContractAt("EverestVault", vaultAddr);
  const tx = await c.setGuardian(guardianAddr);
  console.log("tx:", tx.hash);
  await tx.wait();
  console.log("✅ Guardian set");
}

main().catch((e) => { console.error(e); process.exit(1); });
