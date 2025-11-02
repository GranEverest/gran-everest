import { ethers } from "hardhat";
const VAULT = "0x2e10D59ca5f7eF78727aCe40fEF2BCD9363F20A3";

async function main() {
  const v = await ethers.getContractAt("EverestVault", VAULT);
  console.log("guardian:", await v.guardian());
  console.log("owner   :", await v.owner());
  console.log("paused  :", await v.paused());
}
main().catch((e) => { console.error(e); process.exit(1); });
