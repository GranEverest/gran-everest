// src/hooks/useVaultMulti.ts
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { formatEther, parseEther } from "viem";
import { CHAIN } from "@/chain";
import EverestVaultMulti from "@/abi/EverestVaultMulti.json";

export type VaultView = {
  vaultId: number;
  collateral: bigint;
  debt: bigint;
  collateralEth: string;
  debtEth: string;
};

// ABI robusto (soporta { abi: [...] } o [...])
const EverestVaultMultiAbi =
  (EverestVaultMulti as any).abi ?? (EverestVaultMulti as any);

// Elegir address según red (base mainnet vs testnet)
const RAW_ADDR_MAINNET = process.env.NEXT_PUBLIC_VAULT_MULTI_ADDRESS;
const RAW_ADDR_TESTNET = process.env.NEXT_PUBLIC_VAULT_MULTI_ADDRESS_TESTNET;

const VAULT_MULTI_ADDRESS: `0x${string}` = (
  CHAIN.id === 8453
    ? RAW_ADDR_MAINNET
    : RAW_ADDR_TESTNET || RAW_ADDR_MAINNET
) as `0x${string}`;

if (!VAULT_MULTI_ADDRESS) {
  // Si falta config, que explote claro en consola
  // eslint-disable-next-line no-console
  console.error(
    "[useVaultMulti] Missing NEXT_PUBLIC_VAULT_MULTI_ADDRESS (and/or TESTNET)"
  );
}

// Config base de contrato
const contractConfig = {
  address: VAULT_MULTI_ADDRESS,
  abi: EverestVaultMultiAbi as any,
} as const;

export function useVaultMulti() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Helpers internos
  function ensureClients() {
    if (!publicClient || !walletClient || !address) {
      throw new Error("Connect wallet on the correct network first");
    }
  }

  // ---------------------------------------------------------------------------
  // Views
  // ---------------------------------------------------------------------------

  async function getAllMyVaults(): Promise<VaultView[]> {
    if (!publicClient || !address) return [];

    // TS se cree que esto devuelve any[] -> lo pasamos por unknown
    const count = (await (publicClient as any).readContract({
      ...contractConfig,
      functionName: "vaultCountOf",
      args: [address],
    })) as unknown as bigint;

    const n = Number(count);
    if (!n || n <= 0) return [];

    const results: VaultView[] = [];

    for (let vaultId = 0; vaultId < n; vaultId++) {
      const [collateral, debt] = (await (publicClient as any).readContract({
        ...contractConfig,
        functionName: "getVault",
        args: [address, BigInt(vaultId)],
      })) as unknown as [bigint, bigint];

      results.push({
        vaultId,
        collateral,
        debt,
        collateralEth: formatEther(collateral),
        debtEth: formatEther(debt),
      });
    }

    return results;
  }

  async function getCurrentMaxBorrow(vaultId: number): Promise<bigint> {
    if (!publicClient || !address) return BigInt(0);

    const amount = (await (publicClient as any).readContract({
      ...contractConfig,
      functionName: "currentMaxBorrow",
      args: [address, BigInt(vaultId)],
    })) as unknown as bigint;

    return amount;
  }

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  async function createVault(): Promise<number> {
    ensureClients();

    const hash = await (walletClient as any).writeContract({
      ...contractConfig,
      functionName: "createVault",
      account: address,
    });

    await (publicClient as any).waitForTransactionReceipt({ hash });

    // Después del tx, leemos el count y devolvemos count - 1
    const count = (await (publicClient as any).readContract({
      ...contractConfig,
      functionName: "vaultCountOf",
      args: [address],
    })) as unknown as bigint;

    const lastId = count - BigInt(1);
    return Number(lastId);
  }

  async function deposit(vaultId: number, amountEth: string): Promise<void> {
    ensureClients();
    const value = parseEther(amountEth);

    const hash = await (walletClient as any).writeContract({
      ...contractConfig,
      functionName: "deposit",
      args: [BigInt(vaultId)],
      account: address,
      value,
    });

    await (publicClient as any).waitForTransactionReceipt({ hash });
  }

  async function borrow(vaultId: number, amountEth: string): Promise<void> {
    ensureClients();
    const amountWei = parseEther(amountEth);

    const hash = await (walletClient as any).writeContract({
      ...contractConfig,
      functionName: "borrow",
      args: [BigInt(vaultId), amountWei],
      account: address,
    });

    await (publicClient as any).waitForTransactionReceipt({ hash });
  }

  async function repay(vaultId: number, amountEth: string): Promise<void> {
    ensureClients();
    const value = parseEther(amountEth);

    const hash = await (walletClient as any).writeContract({
      ...contractConfig,
      functionName: "repay",
      args: [BigInt(vaultId)],
      account: address,
      value,
    });

    await (publicClient as any).waitForTransactionReceipt({ hash });
  }

  async function withdraw(
    vaultId: number,
    amountEth: string
  ): Promise<void> {
    ensureClients();
    const amountWei = parseEther(amountEth);

    const hash = await (walletClient as any).writeContract({
      ...contractConfig,
      functionName: "withdraw",
      args: [BigInt(vaultId), amountWei],
      account: address,
    });

    await (publicClient as any).waitForTransactionReceipt({ hash });
  }

  return {
    getAllMyVaults,
    getCurrentMaxBorrow,
    createVault,
    deposit,
    borrow,
    repay,
    withdraw,
    contractAddress: VAULT_MULTI_ADDRESS,
  };
}
