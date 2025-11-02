/**
 * GranEverest — chain config (Base / Base Sepolia)
 * - Selecciona la red desde NEXT_PUBLIC_CHAIN = "base" | "baseSepolia" (default: base)
 * - Permite override del RPC con NEXT_PUBLIC_RPC_URL
 */

type ChainLike = {
  id: number;
  name: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: { default: { http: string[] }; public?: { http: string[] } };
  blockExplorers?: { default: { name: string; url: string } };
};

export const BASE: ChainLike = {
  id: 8453,
  name: "Base",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://mainnet.base.org"] },
    public: { http: ["https://mainnet.base.org"] },
  },
  blockExplorers: {
    default: { name: "BaseScan", url: "https://basescan.org" },
  },
};

export const BASE_SEPOLIA: ChainLike = {
  id: 84532,
  name: "Base Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://sepolia.base.org"] },
    public: { http: ["https://sepolia.base.org"] },
  },
  blockExplorers: {
    default: { name: "BaseScan (Sepolia)", url: "https://sepolia.basescan.org" },
  },
};

const ENV_CHAIN = (process.env.NEXT_PUBLIC_CHAIN ?? "base").toLowerCase();
const RPC_OVERRIDE = (process.env.NEXT_PUBLIC_RPC_URL ?? "").trim();

export const CHAINS = {
  base: BASE,
  basesepolia: BASE_SEPOLIA,
  "base-sepolia": BASE_SEPOLIA,
} as const;

function withRpcOverride(chain: ChainLike): ChainLike {
  if (!RPC_OVERRIDE) return chain;
  return {
    ...chain,
    rpcUrls: {
      default: { http: [RPC_OVERRIDE] },
      public: { http: [RPC_OVERRIDE] },
    },
  };
}

// Selección final (default: base mainnet)
export const CHAIN: ChainLike = withRpcOverride(
  CHAINS[ENV_CHAIN as keyof typeof CHAINS] ?? BASE
);

// Helpers útiles
export const IS_MAINNET = CHAIN.id === 8453;
export type { ChainLike as ChainConfig };
