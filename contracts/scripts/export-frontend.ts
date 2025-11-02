import { artifacts } from "hardhat";
import { promises as fs } from "fs";
import path from "path";

async function main() {
  const art = await artifacts.readArtifact("EverestVault");
  const out = path.join(__dirname, "..", "..", "web", "src", "abi");
  await fs.mkdir(out, { recursive: true });
  const file = path.join(out, "EverestVault.json");
  await fs.writeFile(file, JSON.stringify(art.abi, null, 2));
  console.log("✅ ABI exported to:", file);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
