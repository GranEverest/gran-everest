import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "dotenv/config";

const { PRIVATE_KEY, BASE_MAINNET_RPC_URL, BASE_SEPOLIA_RPC_URL, ETHERSCAN_API_KEY } = process.env;
const accounts = PRIVATE_KEY ? [PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    base:       { url: BASE_MAINNET_RPC_URL  || "https://mainnet.base.org",  accounts, chainId: 8453 },
    baseSepolia:{ url: BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",   accounts, chainId: 84532 },
  },
  // ✅ V2: una sola API key (no por red). Sin customChains para Base.
  etherscan: {
    apiKey: ETHERSCAN_API_KEY || "",
  },
  // (Opcional) para que no aparezca el aviso de Sourcify
  sourcify: { enabled: false },
  typechain: { outDir: "typechain-types", target: "ethers-v6" },
};
export default config;
