'use client';

// GranEverest – useVault (Base mainnet / Sepolia)
// Hook con estado, lecturas/escrituras, y campos derivados usados por page.tsx.

import { useCallback, useEffect, useState } from "react";
import { CHAIN } from "@/chain";
import EverestVault from "@/abi/EverestVault.json" assert { type: "json" };
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseEther,
  formatEther,
  type Hash,
} from "viem";

// ----- ABI -----
const ABI: any = Array.isArray((EverestVault as any).abi)
  ? (EverestVault as any).abi
  : (EverestVault as any);

// ----- ENV -----
const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`;
const RPC_URL = (process.env.NEXT_PUBLIC_RPC_URL || "https://mainnet.base.org").trim();

// ----- Clients -----
export const publicClient = createPublicClient({
  chain: CHAIN as any,
  transport: http(RPC_URL),
});

export const walletClient =
  typeof window !== "undefined" && (window as any).ethereum
    ? createWalletClient({
        chain: CHAIN as any,
        transport: custom((window as any).ethereum),
      })
    : undefined;

// ----- Helpers -----
const toEth = (x: bigint) => Number(formatEther(x));
const toWei = (amt: string | number) => parseEther(String(amt));

const getActiveAccount = async (): Promise<`0x${string}`> => {
  if (!walletClient) throw new Error("Wallet no disponible. Conectá tu wallet.");
  const addrs = await walletClient.getAddresses();
  const a = addrs?.[0];
  if (!a) throw new Error("No se detectó ninguna cuenta conectada.");
  return a as `0x${string}`;
};

type TxResult =
  | { ok: true; hash: Hash }
  | { ok: false; error: string };

// ===== Lecturas puras (usadas por el hook) =====
export const isPaused = async (): Promise<boolean> => {
  return (await publicClient.readContract({
    address: VAULT_ADDRESS,
    abi: ABI,
    functionName: "paused",
    args: [],
  })) as boolean;
};

export type UserData = {
  collateral: bigint;
  debt: bigint;
  maxBorrow: bigint;
  available: bigint;
};

export const getUserData = async (user: `0x${string}`): Promise<UserData> => {
  const [collateral, debt, maxBorrow, available] = (await publicClient.readContract(
    {
      address: VAULT_ADDRESS,
      abi: ABI,
      functionName: "getUserData",
      args: [user],
    }
  )) as [bigint, bigint, bigint, bigint];

  return { collateral, debt, maxBorrow, available };
};

// ===== Writes puras (agregan account + chain) =====
const depositTx = async (amount: string | number, from?: `0x${string}`): Promise<TxResult> => {
  try {
    if (!walletClient) throw new Error("Wallet no disponible. Conectá tu wallet.");
    const account = from ?? (await getActiveAccount());
    const hash = await walletClient.writeContract({
      address: VAULT_ADDRESS,
      abi: ABI,
      functionName: "deposit",
      args: [],
      value: toWei(amount),
      account,
      chain: CHAIN as any,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    return { ok: true, hash };
  } catch (e: any) {
    return { ok: false, error: e?.shortMessage || e?.message || "Tx failed" };
  }
};

const borrowTx = async (amount: string | number, from?: `0x${string}`): Promise<TxResult> => {
  try {
    if (!walletClient) throw new Error("Wallet no disponible. Conectá tu wallet.");
    const account = from ?? (await getActiveAccount());
    const hash = await walletClient.writeContract({
      address: VAULT_ADDRESS,
      abi: ABI,
      functionName: "borrow",
      args: [toWei(amount)],
      account,
      chain: CHAIN as any,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    return { ok: true, hash };
  } catch (e: any) {
    return { ok: false, error: e?.shortMessage || e?.message || "Tx failed" };
  }
};

const repayTx = async (amount: string | number, from?: `0x${string}`): Promise<TxResult> => {
  try {
    if (!walletClient) throw new Error("Wallet no disponible. Conectá tu wallet.");
    const account = from ?? (await getActiveAccount());
    const hash = await walletClient.writeContract({
      address: VAULT_ADDRESS,
      abi: ABI,
      functionName: "repay",
      args: [],
      value: toWei(amount),
      account,
      chain: CHAIN as any,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    return { ok: true, hash };
  } catch (e: any) {
    return { ok: false, error: e?.shortMessage || e?.message || "Tx failed" };
  }
};

const withdrawTx = async (amount: string | number, from?: `0x${string}`): Promise<TxResult> => {
  try {
    if (!walletClient) throw new Error("Wallet no disponible. Conectá tu wallet.");
    const account = from ?? (await getActiveAccount());
    const hash = await walletClient.writeContract({
      address: VAULT_ADDRESS,
      abi: ABI,
      functionName: "withdraw",
      args: [toWei(amount)],
      account,
      chain: CHAIN as any,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    return { ok: true, hash };
  } catch (e: any) {
    return { ok: false, error: e?.shortMessage || e?.message || "Tx failed" };
  }
};

// ===== Hook que usa page.tsx =====
export type EnrichedState = (UserData & {
  paused: boolean;
  collateralEth: number;
  borrowedEth: number;
  borrowLimitEth: number;
  availableEth: number;
  priceEthUsd: number;
}) | null;

export const useVault = (account?: `0x${string}`) => {
  const [state, setState] = useState<EnrichedState>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      if (!account) {
        setState(null);
        setError(null);
        return;
      }
      const [p, data] = await Promise.all([isPaused(), getUserData(account)]);

      // Precio ETH/USD runtime (fallback 0 si falla)
      let priceEthUsd = 0;
      try {
        const r = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
        );
        const j = await r.json();
        priceEthUsd = Number(j?.ethereum?.usd ?? 0) || 0;
      } catch (_) {
        priceEthUsd = 0;
      }

      setState({
        ...data,
        paused: p,
        collateralEth: toEth(data.collateral),
        borrowedEth: toEth(data.debt),
        borrowLimitEth: toEth(data.maxBorrow),
        availableEth: toEth(data.available),
        priceEthUsd,
      });
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Wrappers que refrescan el estado después de la tx
  const deposit = async (amount: number | string): Promise<TxResult> => {
    const r = await depositTx(amount, account);
    if (r.ok) await refresh();
    return r;
    };
  const borrow = async (amount: number | string): Promise<TxResult> => {
    const r = await borrowTx(amount, account);
    if (r.ok) await refresh();
    return r;
  };
  const repay = async (amount: number | string): Promise<TxResult> => {
    const r = await repayTx(amount, account);
    if (r.ok) await refresh();
    return r;
  };
  const withdraw = async (amount: number | string): Promise<TxResult> => {
    const r = await withdrawTx(amount, account);
    if (r.ok) await refresh();
    return r;
  };

  return { state, loading, error, deposit, withdraw, borrow, repay, refresh };
};
