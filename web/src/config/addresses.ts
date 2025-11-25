export const VAULT_CHAIN_ID = 8453; // Base mainnet

export const VAULT_ADDRESS =
  (process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}` | undefined) ??
  ("0x8A83E4349f4bd053cef3083F4219628957f54725" as `0x${string}`);

export const VAULT_ADDRESS_SEPOLIA =
  (process.env.NEXT_PUBLIC_VAULT_ADDRESS_SEPOLIA as `0x${string}` | undefined) ??
  ("0x114c4133a937C3e3A871Ce53B5Ff9975A96AA295" as `0x${string}`);
