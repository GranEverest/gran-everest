// contracts/scripts/exportAbi.cjs
/* Exporta el ABI de EverestVault desde artifacts al front (web/src/abi).
   Funciona en Windows/Mac/Linux y tolera distintos layouts de artifacts. */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ARTIFACTS_DIR = path.join(ROOT, "artifacts");
const PRIMARY_ARTIFACT = path.join(
  ARTIFACTS_DIR,
  "src",
  "EverestVault.sol",
  "EverestVault.json"
);

// destino en el front
const OUT_DIR = path.resolve(__dirname, "..", "..", "web", "src", "abi");
const OUT_FILE = path.join(OUT_DIR, "EverestVault.json");

// --- utils ---
function findFileRecursive(dir, filename) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      const found = findFileRecursive(full, filename);
      if (found) return found;
    } else if (e.isFile() && e.name === filename) {
      return full;
    }
  }
  return null;
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

// --- main ---
function main() {
  if (!fs.existsSync(ARTIFACTS_DIR)) {
    console.error("❌ No existe artifacts/. Corré primero: npx hardhat compile");
    process.exit(1);
  }

  let artifactPath = PRIMARY_ARTIFACT;
  if (!fs.existsSync(artifactPath)) {
    // fallback: buscarlo recursivamente
    artifactPath = findFileRecursive(ARTIFACTS_DIR, "EverestVault.json");
  }

  if (!artifactPath || !fs.existsSync(artifactPath)) {
    console.error(
      "❌ No se encontró EverestVault.json en artifacts. Asegurate de compilar y que el contrato esté en src/EverestVault.sol"
    );
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abi = artifact.abi;
  if (!abi || !Array.isArray(abi)) {
    console.error("❌ El artifact encontrado no tiene un campo 'abi' válido.");
    process.exit(1);
  }

  ensureDir(OUT_DIR);

  // Escribimos como { abi: [...] } (tu hook acepta ambos formatos igual)
  const outJson = JSON.stringify({ abi }, null, 2);
  fs.writeFileSync(OUT_FILE, outJson, "utf8");

  console.log("✅ ABI exportado a:", OUT_FILE);
}

main();
