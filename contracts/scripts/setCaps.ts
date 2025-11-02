import { ethers } from "hardhat";

async function main() {
  const vaultAddr = process.env.VAULT;
  const capColEth = process.env.CAP_COLLATERAL_ETH; // ej "100"
  const capDebtEth= process.env.CAP_DEBT_ETH;       // ej "70"
  if (!vaultAddr || !capColEth || !capDebtEth) {
    throw new Error("Set env: VAULT, CAP_COLLATERAL_ETH, CAP_DEBT_ETH");
  }

  const capColWei = ethers.parseEther(capColEth);
  const capDebtWei= ethers.parseEther(capDebtEth);

  const vault = await ethers.getContractAt("EverestVault", vaultAddr);
  const tx = await vault.setCaps(capColWei, capDebtWei);
  console.log("tx:", tx.hash);
  await tx.wait();
  console.log("✅ Caps set:", capColEth, "ETH (collateral),", capDebtEth, "ETH (debt)");
}
main().catch((e)=>{console.error(e);process.exit(1);});
