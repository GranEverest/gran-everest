// lib/aeroBoldUsdc.ts

// USDC en Base (fijo)
export const USDC_ADDRESS =
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`;

// Estas tres van por env porque dependen de la pool/gauge concretos
export const AERODROME_BOLD_USDC_LP =
  (process.env.NEXT_PUBLIC_BOLD_USDC_LP as `0x${string}` | undefined) ?? undefined;

export const AERODROME_BOLD_USDC_GAUGE =
  (process.env.NEXT_PUBLIC_BOLD_USDC_GAUGE as `0x${string}` | undefined) ?? undefined;

export const AERO_TOKEN =
  (process.env.NEXT_PUBLIC_AERO_TOKEN as `0x${string}` | undefined) ?? undefined;

// Vault GranBoldUsdcVault en Base (el que deployeaste recién)
export const BOLD_USDC_VAULT_ADDRESS =
  process.env.NEXT_PUBLIC_BOLD_USDC_VAULT_ADDRESS as `0x${string}`;

if (!BOLD_USDC_VAULT_ADDRESS) {
  throw new Error("Missing NEXT_PUBLIC_BOLD_USDC_VAULT_ADDRESS");
}

// Opcional: ID de la pool en DefiLlama (para APR real de la pool)
export const DEFILLAMA_BOLD_USDC_POOL_ID =
  process.env.NEXT_PUBLIC_BOLD_USDC_LLAMA_POOL_ID ?? "";

// ABI mínimo ERC20: balanceOf + decimals
export const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

// Pair de Aerodrome (LP token + funciones de pool)
export const pairAbi = [
  ...erc20Abi,
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getReserves",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "reserve0", type: "uint256" },
      { name: "reserve1", type: "uint256" },
      { name: "blockTimestampLast", type: "uint32" },
    ],
  },
  {
    type: "function",
    name: "token0",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "token1",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

// ABI mínimo del gauge de Aerodrome que nos interesa
export const gaugeAbi = [
  {
    type: "function",
    name: "earned",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
