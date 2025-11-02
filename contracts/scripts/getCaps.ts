import { ethers } from "hardhat";

async function main() {
  const vaultAddr = process.env.VAULT;
  if (!vaultAddr) throw new Error("Set VAULT=0x...");
  const v = await ethers.getContractAt("EverestVault", vaultAddr);
  const [tc, td, cc, cd] = await Promise.all([
    v.totalCollateral(), v.totalDebt(), v.capTotalCollateral(), v.capTotalDebt()
  ]);
  console.log("totalCollateral:", ethers.formatEther(tc), "ETH");
  console.log("totalDebt     :", ethers.formatEther(td), "ETH");
  console.log("capCollateral :", cc == 0n ? "UNLIMITED" : `${ethers.formatEther(cc)} ETH`);
  console.log("capDebt       :", cd == 0n ? "UNLIMITED" : `${ethers.formatEther(cd)} ETH`);
}
main().catch((e)=>{console.error(e);process.exit(1);});
