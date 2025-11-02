import { ethers } from "hardhat";

async function main() {
  const VAULT = process.env.VAULT!;
  const v = await ethers.getContractAt("EverestVault", VAULT);
  const [s] = await ethers.getSigners();
  const signer = await s.getAddress();
  const owner = await v.owner();
  console.log({ signer, owner, equal: signer.toLowerCase() === owner.toLowerCase() });
}

main().catch((e)=>{ console.error(e); process.exit(1); });
