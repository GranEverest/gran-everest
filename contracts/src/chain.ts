import { base, baseSepolia } from "viem/chains";
import { defineChain } from "viem";

const hardhat = defineChain({
  id: 31337,
  name: "Hardhat",
  network: "hardhat",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
    public: { http: ["http://127.0.0.1:8545"] }
  }
});

type UiChain = {
  hex: string;
  params: {
    chainId: string;
    chainName: string;
    nativeCurrency: { name: string; symbol: string; decimals: number };
    rpcUrls: string[];
    blockExplorerUrls?: string[];
  };
  viem: any;
};

const env = (process.env.NEXT_PUBLIC_CHAIN || "base").toLowerCase();

function makeUi(c: any, name: string, explorer?: string): UiChain {
  const id = Number(c.id);
  return {
    hex: "0x" + id.toString(16),
    params: {
      chainId: "0x" + id.toString(16),
      chainName: name,
      nativeCurrency: c.nativeCurrency,
      rpcUrls: c.rpcUrls?.default?.http || [],
      blockExplorerUrls: explorer ? [explorer] : undefined
    },
    viem: c
  };
}

export const CHAIN: UiChain =
  env === "baseseoplia" || env === "base-sepolia" || env === "baseSepolia"
    ? makeUi(baseSepolia, "Base Sepolia", "https://sepolia.basescan.org")
    : env === "localhost" || env === "hardhat"
    ? makeUi(hardhat, "Hardhat", undefined)
    : makeUi(base, "Base", "https://basescan.org");
