// web/src/hooks/useVault.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { CHAIN } from "@/chain";
import GranVaultBaseETH from "@/abi/GranVaultBaseETH.json";

// ===== Types =====

type Position = {
  collateral: bigint;
  debt: bigint;
  maxBorrow: bigint;
};

type Status = {
  loading: boolean;
  error: string | null;
  position: Position | null;
};

type UseVaultResult = {
  account: `0x${string}` | null;
  connected: boolean;
  status: Status;
  txPending: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
  deposit: (amountWei: bigint) => Promise<void>;
  borrow: (amountWei: bigint, to: string) => Promise<void>;
  repay: (amountWei: bigint) => Promise<void>;
  withdraw: (amountWei: bigint, to: string) => Promise<void>;
};

// ===== Contract config =====

const RAW_VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS;
export const VAULT_ADDRESS = RAW_VAULT_ADDRESS
  ? (RAW_VAULT_ADDRESS as `0x${string}`)
  : undefined;

// Canonical WETH on Base
export const WETH_ADDRESS =
  "0x4200000000000000000000000000000000000006" as `0x${string}`;

// Minimal WETH ABI: wrap/unwrap + approve/allowance
const WETH_ABI: any = [
  {
    type: "function",
    name: "deposit",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [{ name: "wad", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
];

// GranVaultBaseETH ABI (new vault)
const VAULT_ABI: any = (GranVaultBaseETH as any).abi ?? GranVaultBaseETH;

// ===== viem clients (singletons, kept untyped to avoid TS conflicts) =====

let publicClient: any = null;
let walletClient: any = null;

function getPublicClient() {
  if (!publicClient) {
    publicClient = createPublicClient({
      chain: CHAIN as any,
      transport: http(),
    });
  }
  return publicClient;
}

async function getWalletClient() {
  if (!walletClient) {
    const eth = (window as any).ethereum;
    if (!eth) throw new Error("No wallet provider found");
    walletClient = createWalletClient({
      chain: CHAIN as any,
      transport: custom(eth),
    });
  }
  return walletClient;
}

// Helper: ensure WETH allowance for vault (infinite approve once)
async function ensureWethAllowance(owner: `0x${string}`, amountWei: bigint) {
  if (!VAULT_ADDRESS) throw new Error("Vault not configured");

  const client = getPublicClient();

  const current: bigint = (await client.readContract({
    address: WETH_ADDRESS,
    abi: WETH_ABI,
    functionName: "allowance",
    args: [owner, VAULT_ADDRESS],
  })) as bigint;

  if (current >= amountWei) return;

  // Infinite approve so the user signs this only once
  const MAX_UINT256 = BigInt(
    "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
  );

  const wc = await getWalletClient();

  await wc.writeContract({
    address: WETH_ADDRESS,
    abi: WETH_ABI,
    functionName: "approve",
    account: owner,
    args: [VAULT_ADDRESS, MAX_UINT256],
  });
}

// ===== Main hook =====

export function useVault(): UseVaultResult {
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<Status>({
    loading: false,
    error: null,
    position: null,
  });
  const [txPending, setTxPending] = useState(false);

  // ---- Eager connect + accountsChanged listener ----
  useEffect(() => {
    const eth =
      typeof window !== "undefined" ? (window as any).ethereum : null;
    if (!eth?.request) return;

    let cancelled = false;

    eth
      .request({ method: "eth_accounts" })
      .then((accounts: string[]) => {
        if (cancelled) return;
        if (accounts && accounts.length > 0) {
          const addr = accounts[0] as `0x${string}`;
          setAccount(addr);
          setConnected(true);
        }
      })
      .catch(() => {
        // ignore
      });

    const handleAccountsChanged = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        setAccount(null);
        setConnected(false);
        return;
      }
      const addr = accounts[0] as `0x${string}`;
      setAccount(addr);
      setConnected(true);
    };

    eth.on?.("accountsChanged", handleAccountsChanged);

    return () => {
      cancelled = true;
      eth.removeListener?.("accountsChanged", handleAccountsChanged);
    };
  }, []);

  // ---- Read vault data (collateral / debt / maxBorrow) ----
  const refresh = useCallback(async () => {
    if (!VAULT_ADDRESS) {
      setStatus((s) => ({
        ...s,
        error: "Vault not configured",
      }));
      return;
    }

    try {
      setStatus((s) => ({ ...s, loading: true, error: null }));

      let collateral = BigInt(0);
      let debt = BigInt(0);
      let maxBorrow = BigInt(0);

      const client = getPublicClient();

      if (account) {
        const [coll, deb, max] = (await Promise.all([
          client.readContract({
            address: VAULT_ADDRESS,
            abi: VAULT_ABI,
            functionName: "collateral",
            args: [account],
          }),
          client.readContract({
            address: VAULT_ADDRESS,
            abi: VAULT_ABI,
            functionName: "debt",
            args: [account],
          }),
          client.readContract({
            address: VAULT_ADDRESS,
            abi: VAULT_ABI,
            functionName: "maxBorrow",
            args: [account],
          }),
        ])) as [bigint, bigint, bigint];

        collateral = coll ?? BigInt(0);
        debt = deb ?? BigInt(0);
        maxBorrow = max ?? BigInt(0);
      }

      setStatus({
        loading: false,
        error: null,
        position: { collateral, debt, maxBorrow },
      });
    } catch (err: any) {
      console.error("refresh error", err);
      setStatus((s) => ({
        ...s,
        loading: false,
        error:
          err?.shortMessage ||
          err?.message ||
          "Failed to load vault data",
      }));
    }
  }, [account]);

  // ---- Connect / disconnect ----

  const connect = useCallback(async () => {
    try {
      const eth = (window as any).ethereum;
      if (!eth?.request) {
        alert("No Ethereum wallet detected.");
        return;
      }

      const accounts: string[] = await eth.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        setAccount(null);
        setConnected(false);
        return;
      }

      const addr = accounts[0] as `0x${string}`;
      setAccount(addr);
      setConnected(true);
    } catch (err) {
      console.error("connect error", err);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setAccount(null);
    setConnected(false);

    try {
      const eth = (window as any).ethereum;
      if (eth?.request) {
        await eth.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      }
    } catch (err) {
      console.warn("wallet_revokePermissions failed (safe to ignore)", err);
    }
  }, []);

  // ---- Helper for tx + auto-refresh ----
  async function runTx<T>(fn: () => Promise<T>): Promise<T | undefined> {
    try {
      setTxPending(true);
      const result = await fn();
      await refresh();
      return result;
    } finally {
      setTxPending(false);
    }
  }

  // ---- Vault actions (ETH UI, WETH on-chain) ----

  // Deposit ETH: wrap to WETH -> approve (infinite, once) -> vault.deposit(amount, account)
  const deposit = useCallback(
    async (amountWei: bigint) => {
      if (!VAULT_ADDRESS) throw new Error("Vault not configured");
      if (!account) throw new Error("Not connected");

      await runTx(async () => {
        const wc = await getWalletClient();
        const sender = account;

        // 1) Wrap ETH -> WETH
        await wc.writeContract({
          address: WETH_ADDRESS,
          abi: WETH_ABI,
          functionName: "deposit",
          account: sender,
          args: [],
          value: amountWei,
        });

        // 2) Ensure allowance (infinite approve once)
        await ensureWethAllowance(sender, amountWei);

        // 3) Deposit WETH as collateral
        return wc.writeContract({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: "deposit",
          account: sender,
          args: [amountWei, sender],
        });
      });
    },
    [account],
  );

  // Borrow: vault sends WETH to user, then unwrap to ETH in the same account
  const borrow = useCallback(
    async (amountWei: bigint, _to: string) => {
      if (!VAULT_ADDRESS) throw new Error("Vault not configured");
      if (!account) throw new Error("Not connected");

      await runTx(async () => {
        const wc = await getWalletClient();
        const sender = account;

        // 1) Borrow WETH to the user
        await wc.writeContract({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: "borrow",
          account: sender,
          args: [amountWei, sender],
        });

        // 2) Unwrap WETH -> ETH
        await wc.writeContract({
          address: WETH_ADDRESS,
          abi: WETH_ABI,
          functionName: "withdraw",
          account: sender,
          args: [amountWei],
        });

        // If _to != account, forwarding ETH happens off-contract (future UI).
        return;
      });
    },
    [account],
  );

  // Repay: wrap ETH -> WETH and repay in the vault
  const repay = useCallback(
    async (amountWei: bigint) => {
      if (!VAULT_ADDRESS) throw new Error("Vault not configured");
      if (!account) throw new Error("Not connected");

      await runTx(async () => {
        const wc = await getWalletClient();
        const sender = account;

        // 1) Wrap ETH -> WETH
        await wc.writeContract({
          address: WETH_ADDRESS,
          abi: WETH_ABI,
          functionName: "deposit",
          account: sender,
          args: [],
          value: amountWei,
        });

        // 2) Ensure allowance (infinite approve once)
        await ensureWethAllowance(sender, amountWei);

        // 3) Repay in WETH
        return wc.writeContract({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: "repay",
          account: sender,
          args: [amountWei, sender],
        });
      });
    },
    [account],
  );

  // Withdraw: vault sends WETH to user, then unwrap to ETH
  const withdraw = useCallback(
    async (amountWei: bigint, _to: string) => {
      if (!VAULT_ADDRESS) throw new Error("Vault not configured");
      if (!account) throw new Error("Not connected");

      await runTx(async () => {
        const wc = await getWalletClient();
        const sender = account;

        // 1) Withdraw WETH from vault to user
        await wc.writeContract({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: "withdraw",
          account: sender,
          args: [amountWei, sender, sender],
        });

        // 2) Unwrap WETH -> ETH
        await wc.writeContract({
          address: WETH_ADDRESS,
          abi: WETH_ABI,
          functionName: "withdraw",
          account: sender,
          args: [amountWei],
        });

        // If _to != account, ETH forwarding happens outside the contract.
        return;
      });
    },
    [account],
  );

  return {
    account,
    connected,
    status,
    txPending,
    connect,
    disconnect,
    refresh,
    deposit,
    borrow,
    repay,
    withdraw,
  };
}
