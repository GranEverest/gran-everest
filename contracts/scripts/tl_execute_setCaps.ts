import { ethers } from "hardhat";

async function main() {
  const TL = process.env.TIMELOCK;
  const VA = process.env.VAULT;
  const capColEth = process.env.CAP_COLLATERAL_ETH;
  const capDebtEth= process.env.CAP_DEBT_ETH;
  const saltStr   = process.env.SALT || "GE_SET_CAPS_V1";

  if (!TL || !VA || !capColEth || !capDebtEth) {
    throw new Error("Set env: TIMELOCK, VAULT, CAP_COLLATERAL_ETH, CAP_DEBT_ETH, [SALT]");
  }

  const capColWei = ethers.parseEther(capColEth);
  const capDebtWei= ethers.parseEther(capDebtEth);

  const vault = await ethers.getContractAt("EverestVault", VA);
  const timelock = await ethers.getContractAt("GE_Timelock", TL);

  const data = vault.interface.encodeFunctionData("setCaps", [capColWei, capDebtWei]);
  const predecessor = ethers.ZeroHash;
  const salt = ethers.id(saltStr);

  const tx = await timelock.execute(VA, 0, data, predecessor, salt);
  console.log("execute tx:", tx.hash);
  await tx.wait();
  console.log("✅ Executed setCaps");
}
main().catch((e)=>{console.error(e);process.exit(1);});
