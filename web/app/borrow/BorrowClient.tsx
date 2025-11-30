// web/app/borrow/BorrowClient.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  formatEther,
  parseEther,
  type Address,
  type Hex,
} from "viem";
import { usePublicClient, useWalletClient, useBalance } from "wagmi";

import { useVault } from "@/hooks/useVault";
import { useThemeBoot } from "@/hooks/useThemeBoot";
import { CHAIN } from "@/chain";
import GranRouterBaseETH from "@/abi/GranRouterBaseETH.json";
import GranVaultBaseETH from "@/abi/GranVaultBaseETH.json";

const RAW_VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS || "";
const ZERO = BigInt(0);

// ==== Router + 0x config ====

const routerAbi =
  (GranRouterBaseETH as any).abi ?? (GranRouterBaseETH as any);

const vaultAbi =
  (GranVaultBaseETH as any).abi ?? (GranVaultBaseETH as any);

const ROUTER_ADDRESS = (process.env.NEXT_PUBLIC_ROUTER_ADDRESS || "").trim() as
  | Address
  | "";

const ZEROX_BASE_URL =
  (process.env.NEXT_PUBLIC_ZEROX_BASE_URL || "").trim() ||
  "https://base.api.0x.org";

const ZEROX_API_KEY = (process.env.NEXT_PUBLIC_ZEROX_API_KEY || "").trim();

const WETH_ADDRESS = (
  process.env.NEXT_PUBLIC_WETH_ADDRESS ||
  "0x4200000000000000000000000000000000000006"
).trim() as Address;

type ReceiveAsset = "ETH" | "USDC" | "USDT" | "DAI";

type RouterToken = {
  symbol: ReceiveAsset;
  label: string;
  address?: Address; // undefined = ETH (no routed flow)
  decimals: number;
};

const TOKENS: Record<ReceiveAsset, RouterToken> = {
  ETH: {
    symbol: "ETH",
    label: "ETH",
    address: undefined,
    decimals: 18,
  },
  USDC: {
    symbol: "USDC",
    label: "USDC",
    address: "0x833589fCD6EDb6E08f4c7c32D4f71b54bDa02913",
    decimals: 6,
  },
  USDT: {
    symbol: "USDT",
    label: "USDT",
    address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
    decimals: 6,
  },
  DAI: {
    symbol: "DAI",
    label: "DAI",
    address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    decimals: 18,
  },
};

type ZeroXTransaction = {
  to: string;
  data: string;
  value: string;
};

type ZeroXQuote = {
  buyAmount: string;
  minBuyAmount?: string;
  transaction: ZeroXTransaction;
};

const ZERO_BIG = 0n;

// ABI mínimo de ERC20 para approve
const erc20Abi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
] as const;

// ---- helpers ----
function cleanAmount(value: string): string {
  return value.trim();
}

function formatToken(raw: bigint, decimals: number, show = 2): string {
  if (raw <= ZERO_BIG) return "0.00";
  const base = 10n ** BigInt(decimals);
  const int = raw / base;
  const frac = raw % base;
  const fracStr = frac.toString().padStart(decimals, "0");
  return `${int.toString()}.${fracStr.slice(0, show)}`;
}

async function fetchRouterQuote0x(params: {
  sellAmountWei: bigint;
  buyToken: Address;
  slippageBps: number;
  signal?: AbortSignal;
}): Promise<ZeroXQuote> {
  const { sellAmountWei, buyToken, slippageBps, signal } = params;

  if (!ROUTER_ADDRESS) {
    throw new Error("Router is not configured.");
  }
  if (!ZEROX_API_KEY) {
    throw new Error("0x API key is missing.");
  }

  const qs = new URLSearchParams({
    chainId: String(CHAIN.id),
    sellToken: WETH_ADDRESS,
    buyToken,
    sellAmount: sellAmountWei.toString(),
    taker: ROUTER_ADDRESS,
    slippageBps: String(slippageBps),
  });

  const url = `${
    ZEROX_BASE_URL.replace(/\/$/, "")
  }/swap/allowance-holder/quote?${qs.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "0x-api-key": ZEROX_API_KEY,
      "0x-version": "v2",
      Accept: "application/json",
    },
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`0x quote failed (${res.status}): ${text.slice(0, 140)}`);
  }

  const data = (await res.json()) as ZeroXQuote;
  if (!data.transaction || !data.buyAmount) {
    throw new Error("0x quote response is malformed.");
  }
  return data;
}

export default function BorrowClient() {
  const { dark, toggleTheme } = useThemeBoot();

  const {
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
  } = useVault();

  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // ===== nuevo: modo de depósito + flag local de pending =====
  const [depositMode, setDepositMode] = useState<"ETH" | "WETH">("ETH");
  const [localDepositPending, setLocalDepositPending] = useState(false);

  // ===== balances =====
  const { data: ethBalance } = useBalance({
    address: account ? (account as Address) : undefined,
    chainId: CHAIN.id as any,
    query: {
      enabled: !!account,
    },
  });

  const { data: wethBalance } = useBalance({
    address: account ? (account as Address) : undefined,
    token: WETH_ADDRESS,
    chainId: CHAIN.id as any,
    query: {
      enabled: !!account,
    },
  });

  const wethBalanceFormatted =
    wethBalance && wethBalance.value > ZERO_BIG
      ? Number(wethBalance.formatted).toFixed(4)
      : "0.0000";

  const [depositAmount, setDepositAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [repayAmount, setRepayAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [receiveAsset, setReceiveAsset] = useState<ReceiveAsset>("ETH");

  // Router / 0x state
  const [slippageBps, setSlippageBps] = useState(100); // 1%
  const [swapExecutor, setSwapExecutor] = useState<Address | null>(null);
  const [quote, setQuote] = useState<ZeroXQuote | null>(null);
  const [quoteStatus, setQuoteStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const zeroXRouterAvailable =
    Boolean(ROUTER_ADDRESS) && Boolean(ZEROX_API_KEY);

  // leer swapExecutor del router
  useEffect(() => {
    if (!publicClient || !ROUTER_ADDRESS) return;
    (async () => {
      try {
        const exec = (await publicClient.readContract({
          address: ROUTER_ADDRESS as Address,
          abi: routerAbi as any,
          functionName: "swapExecutor",
          args: [],
        })) as Address;
        setSwapExecutor(exec);
      } catch (err) {
        console.error("read swapExecutor failed", err);
      }
    })();
  }, [publicClient]);

  const shortAccount = useMemo(() => {
    if (!account) return "";
    return `${account.slice(0, 6)}…${account.slice(-4)}`;
  }, [account]);

  const shortVaultAddress = useMemo(() => {
    if (!RAW_VAULT_ADDRESS) return "Not configured";
    return `${RAW_VAULT_ADDRESS.slice(0, 6)}…${RAW_VAULT_ADDRESS.slice(-4)}`;
  }, []);

  const position = status.position;

  const collateralEth = position ? Number(formatEther(position.collateral)) : 0;
  const debtEth = position ? Number(formatEther(position.debt)) : 0;
  const maxBorrowEth = position ? Number(formatEther(position.maxBorrow)) : 0;

  const ltvPct = collateralEth > 0 ? (debtEth / collateralEth) * 100 : 0;
  const extraBorrowEth = Math.max(0, maxBorrowEth - debtEth);

  const hasPosition =
    !!position &&
    (position.collateral > ZERO || position.debt > ZERO || collateralEth > 0);

  const isRouterAsset =
    receiveAsset === "USDC" ||
    receiveAsset === "USDT" ||
    receiveAsset === "DAI";

  const handleConnect = useCallback(async () => {
    try {
      await connect();
    } catch (err) {
      console.error(err);
      alert("Failed to connect wallet.");
    }
  }, [connect]);

  // auto-refresh when connected / account changes
  useEffect(() => {
    if (!connected || !account) return;

    let cancelled = false;

    async function runRefresh() {
      try {
        await refresh();
      } catch (err) {
        if (!cancelled) {
          console.error("auto-refresh error", err);
        }
      }
    }

    runRefresh();
    const id = window.setInterval(runRefresh, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [connected, account, refresh]);

  // ===== Deposit (ETH o WETH, con fallback automático) =====
  const handleDeposit = useCallback(async () => {
    if (!connected || !account) {
      await handleConnect();
      return;
    }

    const cleaned = cleanAmount(depositAmount);
    if (!cleaned) return;

    let amountWei: bigint;
    try {
      amountWei = parseEther(cleaned);
    } catch {
      alert("Please enter a valid deposit amount.");
      return;
    }

    if (amountWei <= ZERO_BIG) return;

    let mode: "ETH" | "WETH" = depositMode;

    // si elegiste ETH pero no tenés ETH suficiente y sí WETH suficiente,
    // cambiamos automáticamente a WETH
    if (
      mode === "ETH" &&
      ethBalance &&
      wethBalance &&
      ethBalance.value < amountWei &&
      wethBalance.value >= amountWei
    ) {
      mode = "WETH";
      setDepositMode("WETH");
    }

    // si seguimos en ETH y no alcanza el ETH, avisamos y no mandamos tx
    if (mode === "ETH" && ethBalance && ethBalance.value < amountWei) {
      alert(
        "You don't have enough ETH on Base for this deposit. If you have WETH, switch to 'Use WETH'."
      );
      return;
    }

    // Flujo actual: ETH (wrap + depósito) usando el hook
    if (mode === "ETH") {
      try {
        await deposit(amountWei);
        setDepositAmount("");
      } catch (err) {
        console.error(err);
        alert("Deposit failed. Please check the amount and your wallet.");
      }
      return;
    }

    // Nuevo flujo: usar WETH existente
    if (!walletClient || !publicClient) {
      alert("Wallet client is not ready. Please reconnect and try again.");
      return;
    }

    if (!RAW_VAULT_ADDRESS.trim()) {
      alert("Vault address is not configured.");
      return;
    }

    const vaultAddress = RAW_VAULT_ADDRESS.trim() as Address;

    if (!wethBalance || wethBalance.value < amountWei) {
      alert("You do not have enough WETH on Base for this deposit.");
      return;
    }

    try {
      setLocalDepositPending(true);

      // 1) approve WETH -> vault
      const approveHash = await walletClient.writeContract({
        address: WETH_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [vaultAddress, amountWei],
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      // 2) deposit(amount, account)
      const depositHash = await walletClient.writeContract({
        address: vaultAddress,
        abi: vaultAbi as any,
        functionName: "deposit",
        args: [amountWei, account as Address],
      });
      await publicClient.waitForTransactionReceipt({ hash: depositHash });

      setDepositAmount("");
      await refresh();
    } catch (err) {
      console.error(err);
      alert(
        "WETH deposit failed. Please verify your balance and try again."
      );
    } finally {
      setLocalDepositPending(false);
    }
  }, [
    connected,
    account,
    depositAmount,
    depositMode,
    deposit,
    handleConnect,
    walletClient,
    publicClient,
    wethBalance,
    ethBalance,
    refresh,
  ]);

  // ===== Cotización 0x para router =====
  useEffect(() => {
    if (!isRouterAsset) {
      setQuote(null);
      setQuoteStatus("idle");
      setQuoteError(null);
      return;
    }

    if (!zeroXRouterAvailable) {
      setQuote(null);
      setQuoteStatus("idle");
      setQuoteError("Routing is currently not available.");
      return;
    }

    const cleaned = cleanAmount(borrowAmount);
    if (!cleaned) {
      setQuote(null);
      setQuoteStatus("idle");
      setQuoteError(null);
      return;
    }

    let amountWei: bigint;
    try {
      amountWei = parseEther(cleaned);
    } catch {
      setQuote(null);
      setQuoteStatus("error");
      setQuoteError("Please enter a valid amount in ETH.");
      return;
    }
    if (amountWei <= ZERO_BIG) {
      setQuote(null);
      setQuoteStatus("idle");
      setQuoteError(null);
      return;
    }

    const cfg = TOKENS[receiveAsset];
    if (!cfg.address) {
      setQuote(null);
      setQuoteStatus("error");
      setQuoteError("Selected asset is not available.");
      return;
    }

    const controller = new AbortController();
    setQuoteStatus("loading");
    setQuoteError(null);

    fetchRouterQuote0x({
      sellAmountWei: amountWei,
      buyToken: cfg.address as Address,
      slippageBps,
      signal: controller.signal,
    })
      .then((q) => {
        setQuote(q);
        setQuoteStatus("idle");
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error("0x quote error:", err);
        setQuote(null);
        setQuoteStatus("error");
        setQuoteError(
          "We couldn’t prepare a route for this amount. Try a slightly different size or another asset."
        );
      });

    return () => controller.abort();
  }, [isRouterAsset, receiveAsset, borrowAmount, slippageBps, zeroXRouterAvailable]);

  const handleBorrow = useCallback(async () => {
    if (!connected || !account) {
      await handleConnect();
      return;
    }

    const cleaned = cleanAmount(borrowAmount);
    if (!cleaned) return;

    let amountWei: bigint;
    try {
      amountWei = parseEther(cleaned);
    } catch {
      alert("Please enter a valid borrow amount in ETH.");
      return;
    }

    // ETH directo
    if (!isRouterAsset) {
      try {
        await borrow(amountWei, account);
        setBorrowAmount("");
      } catch (err) {
        console.error(err);
        alert("Borrow failed. Please check the amount and your wallet.");
      }
      return;
    }

    // Ruta con router
    if (!ROUTER_ADDRESS || !ZEROX_API_KEY) {
      alert(
        "Routing is not available right now. Please choose ETH or try again later."
      );
      return;
    }
    if (!walletClient || !publicClient) {
      alert("Wallet client is not ready. Please reconnect and try again.");
      return;
    }

    const cfg = TOKENS[receiveAsset];
    if (!cfg.address) {
      alert("Selected asset is not available.");
      return;
    }

    const q = quote;
    if (!q || !q.transaction || !q.transaction.data || !q.transaction.to) {
      alert("We could not prepare this route. Please try again in a moment.");
      return;
    }

    if (
      swapExecutor &&
      q.transaction.to.toLowerCase() !== swapExecutor.toLowerCase()
    ) {
      alert(
        "Route target does not match the configured executor. Please try ETH or contact support."
      );
      return;
    }

    const minOut = BigInt(
      q.minBuyAmount && q.minBuyAmount !== "0"
        ? q.minBuyAmount
        : q.buyAmount
    );

    try {
      const hash = await walletClient.writeContract({
        address: ROUTER_ADDRESS as Address,
        abi: routerAbi as any,
        functionName: "borrowAndSwap",
        args: [
          account as Address,
          amountWei,
          cfg.address as Address,
          minOut,
          q.transaction.data as Hex,
        ],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      setBorrowAmount("");
      await refresh();
    } catch (err) {
      console.error("borrow+swap failed:", err);
      alert(
        "The transaction did not complete. If it reverted, your vault position is unchanged and you only paid network gas."
      );
    }
  }, [
    connected,
    account,
    borrowAmount,
    borrow,
    handleConnect,
    isRouterAsset,
    walletClient,
    publicClient,
    quote,
    refresh,
    swapExecutor,
  ]);

  const handleRepay = useCallback(async () => {
    if (!connected) {
      await handleConnect();
      return;
    }

    const cleaned = cleanAmount(repayAmount);
    if (!cleaned) return;

    try {
      const amountWei = parseEther(cleaned);
      await repay(amountWei);
      setRepayAmount("");
    } catch (err) {
      console.error(err);
      alert("Repay failed. Please check the amount and your wallet.");
    }
  }, [connected, repayAmount, repay, handleConnect]);

  const handleRepayAll = useCallback(async () => {
    if (!connected) {
      await handleConnect();
      return;
    }
    if (!position || position.debt === ZERO) return;

    try {
      await repay(position.debt);
      setRepayAmount("");
    } catch (err) {
      console.error(err);
      alert("Repay all failed. Please try again.");
    }
  }, [connected, position, repay, handleConnect]);

  const handleWithdraw = useCallback(async () => {
    if (!connected || !account) {
      await handleConnect();
      return;
    }

    const cleaned = cleanAmount(withdrawAmount);
    if (!cleaned) return;

    try {
      const amountWei = parseEther(cleaned);
      await withdraw(amountWei, account);
      setWithdrawAmount("");
    } catch (err) {
      console.error(err);
      alert("Withdraw failed. Please check the amount and your wallet.");
    }
  }, [connected, account, withdrawAmount, withdraw, handleConnect]);

  const handleWithdrawMax = useCallback(async () => {
    if (!connected || !account) {
      await handleConnect();
      return;
    }
    if (!position) return;

    const MAX_LTV_BPS = BigInt(7000);
    const TEN_THOUSAND = BigInt(10000);

    if (position.debt === ZERO) {
      try {
        await withdraw(position.collateral, account);
        setWithdrawAmount("");
      } catch (err) {
        console.error(err);
        alert("Withdraw max failed. Please try again.");
      }
      return;
    }

    const minCollateral =
      (position.debt * TEN_THOUSAND + (MAX_LTV_BPS - BigInt(1))) /
      MAX_LTV_BPS;

    if (position.collateral <= minCollateral) return;

    const withdrawable = position.collateral - minCollateral;

    try {
      await withdraw(withdrawable, account);
      setWithdrawAmount("");
    } catch (err) {
      console.error(err);
      alert("Withdraw max failed. Please try again.");
    }
  }, [connected, account, position, withdraw, handleConnect]);

  const handleRefresh = useCallback(async () => {
    try {
      await refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to refresh vault state.");
    }
  }, [refresh]);

  const isBusy = txPending || status.loading || localDepositPending;
  const routerReady = zeroXRouterAvailable && !!walletClient && !!publicClient;

  const quoteText =
    isRouterAsset &&
    routerReady &&
    quote &&
    TOKENS[receiveAsset].decimals != null
      ? `Estimated receive: ${formatToken(
          BigInt(quote.buyAmount),
          TOKENS[receiveAsset].decimals
        )} ${receiveAsset}${
          quote.minBuyAmount && quote.minBuyAmount !== "0"
            ? ` · Minimum: ${formatToken(
                BigInt(quote.minBuyAmount),
                TOKENS[receiveAsset].decimals
              )} ${receiveAsset}`
            : ""
        }`
      : "";

  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand">
          GranEverest
        </Link>
        <div className="nav-right">
          <Link href="/docs/" className="pill">
            Docs
          </Link>
          <Link href="/trust/" className="pill">
            Trust
          </Link>
          <button type="button" className="pill" onClick={toggleTheme}>
            {dark ? "Light" : "Dark"}
          </button>
        </div>
      </nav>

      <main className="wrap">
        <section className="borrow-top">
          <div className="borrow-network small">
            <span className="badge">{CHAIN.name || "Base"}</span>
            <span className="muted">
              {" "}
              · Debt unit: ETH · Max LTV 70% · No liquidations
            </span>
          </div>
          <div className="borrow-connect">
            {connected && account ? (
              <>
                <span className="wallet-chip small">{shortAccount}</span>
                <button
                  type="button"
                  className="btn-secondary small"
                  onClick={disconnect}
                  disabled={isBusy}
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn-primary small"
                onClick={handleConnect}
                disabled={isBusy}
              >
                Connect wallet
              </button>
            )}
          </div>
        </section>

        {/* TOP GRID: VAULTS + MY VAULTS */}
        <section className="borrow-grid">
          <article className="card">
            <h2>Vaults</h2>
            <div className="product-card">
              <div className="product-header">
                <div>
                  <h3>ETH vault</h3>
                  <p className="small">
                    Single ETH collateral vault. 0% interest. No liquidations.
                    Debt in ETH.
                  </p>
                </div>
              </div>
              <div className="product-meta small">
                <div>
                  Network:{" "}
                  <span className="muted">{CHAIN.name || "Base"}</span>
                </div>
                <div>
                  Contract:{" "}
                  <code>{RAW_VAULT_ADDRESS ? shortVaultAddress : "—"}</code>
                </div>
              </div>
              <p className="small muted">
                The app keeps the surface narrow and transparent: one ETH vault
                on Base, a fixed LTV ceiling and a single protocol fee on
                deposits and withdrawals.
              </p>
            </div>
          </article>

          <article className="card">
            <h2>My vaults</h2>
            {!connected && (
              <p className="small muted">
                Connect your wallet and deposit ETH in the vault below to open
                your credit line.
              </p>
            )}
            {connected && !hasPosition && (
              <p className="small muted">
                Deposit ETH in the ETH vault below to open your credit line.
              </p>
            )}
            {connected && hasPosition && (
              <div className="status-box">
                <div className="small">
                  Wallet vault: <strong>{shortAccount}</strong>
                </div>
                <div className="small muted">
                  Collateral: {collateralEth.toFixed(4)} ETH · Debt:{" "}
                  {debtEth.toFixed(4)} ETH · LTV: {ltvPct.toFixed(2)}% · Max
                  extra borrow: {extraBorrowEth.toFixed(4)} ETH
                </div>
              </div>
            )}
          </article>
        </section>

        {/* MAIN ETH VAULT CARD */}
        <section className="card card-full">
          <header className="card-header">
            <div>
              <h2>ETH vault</h2>
              <p className="small muted">
                Deposit ETH as collateral, borrow at 0% interest, repay to
                withdraw. Max LTV 70%.
              </p>
            </div>
            <button
              type="button"
              className="btn-primary small"
              onClick={handleRefresh}
              disabled={isBusy || !connected}
            >
              Refresh
            </button>
          </header>

          {status.error && (
            <div className="status-box">
              <span className="small">Error: {status.error}</span>
            </div>
          )}

          {!connected && (
            <>
              <p className="small muted">
                Connect your wallet to view metrics and actions.
              </p>
              <p className="small muted">
                No liquidation risk. Max LTV is capped on-chain at 70%. Fees:
                0.25% on deposit &amp; withdrawal only. Borrow &amp; repay have
                no protocol fee (network gas only).
              </p>
            </>
          )}

          {connected && (
            <>
              <div className="metrics-grid">
                <div className="metric">
                  <div className="metric-label small muted">Collateral</div>
                  <div className="metric-value">
                    {collateralEth.toFixed(4)} <span>ETH</span>
                  </div>
                </div>
                <div className="metric">
                  <div className="metric-label small muted">Debt</div>
                  <div className="metric-value">
                    {debtEth.toFixed(4)} <span>ETH</span>
                  </div>
                </div>
                <div className="metric">
                  <div className="metric-label small muted">LTV</div>
                  <div className="metric-value">
                    {ltvPct.toFixed(2)} <span>%</span>
                  </div>
                </div>
                <div className="metric">
                  <div className="metric-label small muted">
                    Max extra borrow
                  </div>
                  <div className="metric-value">
                    {extraBorrowEth.toFixed(4)} <span>ETH</span>
                  </div>
                </div>
              </div>

              <div className="actions-grid">
                {/* Deposit */}
                <div className="action-block">
                  <div className="action-title">Deposit</div>
                  <p className="small muted">
                    Deposit ETH as collateral. A 0.25% protocol fee applies on
                    each deposit. If you already hold WETH on Base, you can
                    deposit directly from that balance.
                  </p>

                  {/* selector ETH / WETH */}
                  <div
                    className="action-row action-row-column"
                    style={{ marginTop: 4 }}
                  >
                    <div className="action-row-left">
                      <span className="small muted">Source</span>
                      <div className="pill-toggle">
                        <button
                          type="button"
                          className={
                            "pill-option small" +
                            (depositMode === "ETH" ? " pill-option-active" : "")
                          }
                          onClick={() => setDepositMode("ETH")}
                        >
                          Use ETH (wrap)
                        </button>
                        <button
                          type="button"
                          className={
                            "pill-option small" +
                            (depositMode === "WETH"
                              ? " pill-option-active"
                              : "")
                          }
                          onClick={() => setDepositMode("WETH")}
                        >
                          Use WETH
                        </button>
                      </div>
                      {depositMode === "WETH" && (
                        <p
                          className="small muted"
                          style={{ marginTop: 4 }}
                        >
                          Using your existing WETH on Base. Balance:{" "}
                          {wethBalanceFormatted} WETH.
                        </p>
                      )}
                    </div>
                  </div>

                  <div
                    className="action-row action-row-column"
                    style={{ marginTop: 4 }}
                  >
                    <div className="action-row-left">
                      <label className="small muted" htmlFor="deposit-amount">
                        Amount in ETH
                      </label>
                      <input
                        id="deposit-amount"
                        className="input"
                        placeholder="0.00"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="action-button-center">
                    <button
                      type="button"
                      className="btn-primary small"
                      disabled={isBusy || !cleanAmount(depositAmount)}
                      onClick={handleDeposit}
                    >
                      Deposit collateral
                    </button>
                  </div>
                </div>

                {/* Borrow */}
                <div className="action-block">
                  <div className="action-title">Borrow</div>

                  <div className="action-row action-row-column">
                    <div className="action-row-left">
                      <label className="small muted" htmlFor="receive-asset">
                        Receive asset
                      </label>
                      <select
                        id="receive-asset"
                        className="select"
                        value={receiveAsset}
                        onChange={(e) =>
                          setReceiveAsset(e.target.value as ReceiveAsset)
                        }
                      >
                        <option value="ETH">{TOKENS.ETH.label}</option>
                        <option value="USDC">{TOKENS.USDC.label}</option>
                        <option value="USDT">{TOKENS.USDT.label}</option>
                        <option value="DAI">{TOKENS.DAI.label}</option>
                      </select>
                    </div>
                  </div>

                  <div className="action-row action-row-column">
                    <div className="action-row-left">
                      <label className="small muted" htmlFor="borrow-amount">
                        Amount in ETH
                      </label>
                      <input
                        id="borrow-amount"
                        className="input"
                        placeholder="0.00"
                        value={borrowAmount}
                        onChange={(e) => setBorrowAmount(e.target.value)}
                      />
                      <div className="small muted borrow-note">
                        Max:{" "}
                        <button
                          type="button"
                          className="inline-link"
                          onClick={() =>
                            extraBorrowEth > 0 &&
                            setBorrowAmount(extraBorrowEth.toFixed(6))
                          }
                          disabled={extraBorrowEth <= 0}
                        >
                          {extraBorrowEth.toFixed(4)} ETH
                        </button>
                      </div>

                      {isRouterAsset && (
                        <>
                          <div
                            className="small muted"
                            style={{ marginTop: 4 }}
                          >
                            Slippage:
                            <select
                              className="select"
                              style={{
                                marginLeft: 6,
                                paddingBlock: 2,
                                paddingInline: 8,
                              }}
                              value={slippageBps}
                              onChange={(e) =>
                                setSlippageBps(
                                  Number(e.target.value || 100)
                                )
                              }
                            >
                              <option value={10}>0.10%</option>
                              <option value={50}>0.50%</option>
                              <option value={100}>1.00%</option>
                            </select>
                          </div>

                          <div
                            className="small muted"
                            style={{ marginTop: 4 }}
                          >
                            {quoteStatus === "loading" && "Preparing route…"}
                            {quoteStatus === "error" && quoteError && (
                              <span style={{ color: "#b00020" }}>
                                {quoteError}
                              </span>
                            )}
                            {quoteText &&
                              quoteStatus !== "loading" &&
                              !quoteError && <span>{quoteText}</span>}
                            {isRouterAsset && !routerReady && (
                              <span style={{ color: "#b00020" }}>
                                This asset is not available right now.
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="small muted helper-text">
                    Values are displayed in ETH. Borrowing always happens in
                    ETH. For USDC / USDT / DAI the app routes the borrowed ETH
                    through a swap. If execution reverts, your vault position is
                    unchanged and you only pay network gas.
                  </p>

                  <div className="action-button-center">
                    <button
                      type="button"
                      className="btn-primary small"
                      disabled={
                        isBusy ||
                        !cleanAmount(borrowAmount) ||
                        extraBorrowEth <= 0 ||
                        (isRouterAsset && !routerReady)
                      }
                      onClick={handleBorrow}
                    >
                      Borrow at 0% interest
                    </button>
                  </div>
                </div>
              </div>

              <div className="actions-grid">
                {/* Repay */}
                <div className="action-block">
                  <div className="action-title">Repay</div>
                  <div className="action-row action-row-column">
                    <div className="action-row-left">
                      <label className="small muted" htmlFor="repay-amount">
                        Amount in ETH
                      </label>
                      <input
                        id="repay-amount"
                        className="input"
                        placeholder="0.00"
                        value={repayAmount}
                        onChange={(e) => setRepayAmount(e.target.value)}
                      />
                      <p className="small muted">
                        Current debt {debtEth.toFixed(4)} ETH
                      </p>
                    </div>
                  </div>
                  <div className="action-button-center">
                    <button
                      type="button"
                      className="btn-primary small"
                      disabled={isBusy || !cleanAmount(repayAmount)}
                      onClick={handleRepay}
                    >
                      Repay
                    </button>
                  </div>
                  <button
                    type="button"
                    className="link-button"
                    disabled={isBusy || !position || position.debt === ZERO}
                    onClick={handleRepayAll}
                  >
                    Repay all
                  </button>
                </div>

                {/* Withdraw */}
                <div className="action-block">
                  <div className="action-title">Withdraw</div>
                  <div className="action-row action-row-column">
                    <div className="action-row-left">
                      <label className="small muted" htmlFor="withdraw-amount">
                        Amount in ETH
                      </label>
                      <input
                        id="withdraw-amount"
                        className="input"
                        placeholder="0.00"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                      />
                      <p className="small muted">
                        Collateral is kept at or below 70% LTV when
                        withdrawing.
                      </p>
                    </div>
                  </div>
                  <div className="action-button-center">
                    <button
                      type="button"
                      className="btn-primary small"
                      disabled={isBusy || !cleanAmount(withdrawAmount)}
                      onClick={handleWithdraw}
                    >
                      Withdraw collateral
                    </button>
                  </div>
                  <button
                    type="button"
                    className="link-button"
                    disabled={isBusy || !position}
                    onClick={handleWithdrawMax}
                  >
                    Withdraw max
                  </button>
                </div>
              </div>

              <p className="small muted">
                No liquidation risk. Max LTV is hard-coded at 70%. Fees: 0.25%
                on deposit &amp; withdrawal only. Borrow &amp; repay have no
                protocol fee (gas only). For routed assets, if execution
                reverts, your vault position stays exactly the same and you only
                pay network gas.
              </p>
            </>
          )}
        </section>
      </main>

      <style jsx global>{`
        :root {
          --bg: #ffffff;
          --text: #111111;
          --muted: #666666;
          --card: #fafafa;
          --border: #e5e5e5;
          --btn-bg: #ffffff;
          --btn-fg: #111111;
          --brand: #111111;
          --link: #111111;
        }
        html[data-theme="dark"] {
          --bg: #0f0f0f;
          --text: #e7e7e7;
          --muted: #bdbdbd;
          --card: #111111;
          --border: #222222;
          --btn-bg: #ffffff;
          --btn-fg: #111111;
          --brand: var(--text);
          --link: var(--text);
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: var(--bg);
          color: var(--text);
          font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI",
            Roboto, Helvetica, Arial, sans-serif;
        }

        a {
          color: var(--link);
          text-decoration: none;
        }

        .wrap {
          max-width: 1100px;
          margin: 0 auto;
          padding: 16px 20px 96px;
        }

        .nav {
          position: sticky;
          top: 0;
          z-index: 10;
          display: flex;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          background: var(--bg);
        }

        .brand {
          color: var(--brand) !important;
          font-weight: 600;
          font-size: 15px;
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 12px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: var(--btn-bg);
          color: var(--btn-fg) !important;
          font-size: 13px;
          line-height: 1;
          cursor: pointer;
        }

        /* toggle ETH / WETH */
        .pill-toggle {
          display: inline-flex;
          border-radius: 999px;
          border: 1px solid var(--border);
          overflow: hidden;
          background: transparent;
          margin-top: 4px;
        }

        .pill-option {
          border: none;
          background: transparent;
          padding: 4px 10px;
          font-size: 12px;
          cursor: pointer;
          color: var(--muted);
        }

        .pill-option-active {
          background: var(--btn-bg);
          color: var(--btn-fg);
          font-weight: 500;
        }

        .small {
          font-size: 13px;
          color: var(--muted);
        }

        .muted {
          color: var(--muted);
        }

        .borrow-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 10px;
        }

        .borrow-network {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .borrow-connect {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: var(--btn-bg);
          color: var(--btn-fg);
        }

        .wallet-chip {
          padding: 4px 8px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: var(--card);
        }

        .btn-primary,
        .btn-secondary {
          border-radius: 999px;
          border: 1px solid var(--border);
          padding: 6px 12px;
          background: var(--btn-bg);
          color: var(--btn-fg);
          cursor: pointer;
        }

        .btn-secondary {
          background: transparent;
          color: var(--text);
        }

        .btn-primary:disabled,
        .btn-secondary:disabled,
        .link-button:disabled,
        .inline-link:disabled {
          opacity: 0.5;
          cursor: default;
        }

        .borrow-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-top: 20px;
        }

        @media (max-width: 900px) {
          .borrow-grid {
            grid-template-columns: 1fr;
          }
          .borrow-top {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        .card {
          background: var(--card);
          border-radius: 12px;
          border: 1px solid var(--border);
          padding: 16px 18px;
        }

        .card-full {
          margin-top: 20px;
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .product-card {
          border-radius: 10px;
          border: 1px solid var(--border);
          padding: 14px 14px 12px;
          background: rgba(0, 0, 0, 0.02);
        }

        html[data-theme="dark"] .product-card {
          background: rgba(0, 0, 0, 0.1);
        }

        .product-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 8px;
        }

        .product-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin: 8px 0 10px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 14px;
        }

        @media (max-width: 900px) {
          .metrics-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        .metric {
          border-radius: 10px;
          border: 1px solid var(--border);
          padding: 10px;
        }

        .metric-label {
          margin-bottom: 4px;
        }

        .metric-value {
          font-size: 14px;
        }

        .metric-value span {
          font-size: 12px;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 12px;
        }

        @media (max-width: 900px) {
          .actions-grid {
            grid-template-columns: 1fr;
          }
        }

        .action-block {
          border-radius: 10px;
          border: 1px solid var(--border);
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .action-title {
          font-size: 13px;
          font-weight: 500;
        }

        .action-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }

        .action-row-column {
          flex-direction: column;
          align-items: stretch;
        }

        .action-row-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
          flex: 1;
        }

        .action-button-center {
          margin-top: 4px;
          text-align: center;
        }

        .action-button-center .btn-primary {
          min-width: 170px;
        }

        .borrow-note {
          font-size: 11px;
        }

        .helper-text {
          margin-top: 6px;
        }

        .input {
          width: 100%;
          border-radius: 999px;
          border: 1px solid var(--border);
          padding: 6px 10px;
          background: #ffffff;
          color: #111111;
          font-size: 13px;
        }

        html[data-theme="dark"] .input {
          background: var(--card);
          color: var(--text);
        }

        .select {
          border-radius: 999px;
          border: 1px solid var(--border);
          padding: 4px 10px;
          background: var(--btn-bg);
          color: var(--btn-fg);
          font-size: 13px;
          min-width: 140px;
          max-width: 180px;
        }

        .link-button {
          background: none;
          border: none;
          padding: 0;
          color: var(--link);
          cursor: pointer;
          text-decoration: underline;
          font-size: 12px;
          margin-top: 4px;
        }

        .inline-link {
          background: none;
          border: none;
          padding: 0;
          color: var(--link);
          cursor: pointer;
          text-decoration: underline;
          font-size: 11px;
        }

        .status-box {
          margin-top: 4px;
          margin-bottom: 8px;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: rgba(0, 0, 0, 0.03);
        }

        html[data-theme="dark"] .status-box {
          background: rgba(0, 0, 0, 0.12);
        }
      `}</style>
    </>
  );
}
