import { ethers } from "hardhat";

async function main() {
  const MIN_DELAY = Number(process.env.MIN_DELAY || 24 * 60 * 60); // 24h default
  const OWNER_SAFE = process.env.OWNER_SAFE; // proposer/admin inicial
  if (!OWNER_SAFE) throw new Error("Missing OWNER_SAFE env var");

  const proposers = [OWNER_SAFE];
  const executors = [ethers.ZeroAddress]; // cualquiera ejecuta
  const admin     = OWNER_SAFE;

  const Timelock = await ethers.getContractFactory("GE_Timelock");
  const tl = await Timelock.deploy(MIN_DELAY, proposers, executors, admin);
  await tl.waitForDeployment();
  const addr = await tl.getAddress();

  console.log("✅ Timelock deployed:", addr);

  // Lectura best-effort (algunos RPC devuelven 0x si llamás enseguida)
  try {
    const delay = await (await ethers.getContractAt("GE_Timelock", addr)).getMinDelay();
    console.log("  minDelay:", delay.toString());
  } catch (e) {
    console.log("  (info) getMinDelay no disponible aún; MIN_DELAY usado:", MIN_DELAY);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
