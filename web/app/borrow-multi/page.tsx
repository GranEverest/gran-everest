// web/app/borrow-multi/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

import {
  WagmiProvider,
  useAccount,
  useConnect,
  useDisconnect,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "@/wagmi";

import { formatEther, parseEther } from "viem";
import { useVaultMulti, VaultView } from "@/hooks/useVaultMulti";
import { CHAIN } from "@/chain";
import { useSwap } from "@/hooks/useSwap";
import type { ReceiveAsset } from "@/hooks/useSwap";

type ScreenState = "idle" | "loading";

const queryClient = new QueryClient();

// ---------------------------------------------------------------------
// Wrapper con providers
// ---------------------------------------------------------------------
export default function BorrowMultiPage() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <BorrowMultiScreen />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// ---------------------------------------------------------------------
// Pantalla real
// ---------------------------------------------------------------------
function BorrowMultiScreen() {
  const { address } = useAccount();

  // wagmi v2
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const {
    getAllMyVaults,
    getCurrentMaxBorrow,
    createVault,
    deposit,
    borrow,
    repay,
    withdraw,
    contractAddress,
  } = useVaultMulti();

  const { swapEthForToken } = useSwap();

  const [vaults, setVaults] = useState<VaultView[]>([]);
  const [selectedVaultId, setSelectedVaultId] = useState<number | null>(null);
  const [maxBorrowEth, setMaxBorrowEth] = useState<string>("0.0");

  const [depositAmount, setDepositAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [repayAmount, setRepayAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const [status, setStatus] = useState<string>("");
  const [screenState, setScreenState] = useState<ScreenState>("idle");

  const [receiveAsset, setReceiveAsset] = useState<ReceiveAsset>("ETH");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function refreshVaults() {
    if (!address) return;

    const wrong = typeof chainId === "number" && chainId !== CHAIN.id;
    if (wrong) return;

    setScreenState("loading");
    setStatus("Refreshing vaults…");

    try {
      const vs = await getAllMyVaults();
      setVaults(vs);

      let id = selectedVaultId;
      if (id === null) {
        id = vs.length > 0 ? vs[0].vaultId : null;
        setSelectedVaultId(id);
      }

      if (id !== null) {
        const max = await getCurrentMaxBorrow(id);
        setMaxBorrowEth(formatEther(max));
      } else {
        setMaxBorrowEth("0.0");
      }

      setStatus("");
    } catch (err: any) {
      console.error(err);
      setStatus(err?.message || "Error refreshing vaults");
    } finally {
      setScreenState("idle");
    }
  }

  useEffect(() => {
    setStatus("");
    if (!address) {
      setVaults([]);
      setSelectedVaultId(null);
      setMaxBorrowEth("0.0");
      return;
    }
    if (!mounted) return;

    const wrong = typeof chainId === "number" && chainId !== CHAIN.id;
    if (wrong) return;

    void refreshVaults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, chainId, mounted]);

  // hasta que no esté montado, no renderizamos nada → sin hydration error
  if (!mounted) {
    return null;
  }

  const primaryConnector = connectors[0];

  const isWrongNetwork =
    !!address && typeof chainId === "number" && chainId !== CHAIN.id;

  const selectedVault: VaultView | undefined =
    selectedVaultId === null
      ? undefined
      : vaults.find((v) => v.vaultId === selectedVaultId);

  // sin BigInt literals
  const ltvPercent = (() => {
    if (!selectedVault) return "0";
    const collateralNum = Number(selectedVault.collateral);
    if (!collateralNum) return "0";
    const debtNum = Number(selectedVault.debt);
    const num = debtNum / collateralNum;
    return (num * 100).toFixed(2);
  })();

  async function handleCreateVault() {
    if (!address || isWrongNetwork) return;

    setScreenState("loading");
    setStatus("Creating vault…");
    try {
      const id = await createVault();
      setSelectedVaultId(id);
      await refreshVaults();
      setStatus(`Vault #${id} created`);
    } catch (err: any) {
      console.error(err);
      setStatus(err?.message || "Error creating vault");
    } finally {
      setScreenState("idle");
    }
  }

  async function handleDeposit() {
    if (selectedVaultId === null) {
      setStatus("Select a vault first");
      return;
    }
    if (!depositAmount) {
      setStatus("Enter an amount to deposit");
      return;
    }

    setScreenState("loading");
    setStatus("Depositing…");
    try {
      await deposit(selectedVaultId, depositAmount);
      setDepositAmount("");
      await refreshVaults();
      setStatus("Deposit done");
    } catch (err: any) {
      console.error(err);
      setStatus(err?.message || "Deposit failed");
    } finally {
      setScreenState("idle");
    }
  }

  async function handleBorrow() {
    if (selectedVaultId === null) {
      setStatus("Select a vault first");
      return;
    }
    if (!borrowAmount) {
      setStatus("Enter an amount to borrow");
      return;
    }

    setScreenState("loading");
    setStatus("Borrowing…");
    try {
      const amountEthStr = borrowAmount;

      // 1) Borrow en ETH desde el vault
      await borrow(selectedVaultId, amountEthStr);
      setBorrowAmount("");
      await refreshVaults();

      // 2) Swap a otro asset si corresponde
      if (receiveAsset !== "ETH" && address) {
        setStatus(`Borrow done. Swapping to ${receiveAsset}…`);

        try {
          const amountWei = parseEther(amountEthStr);
          await swapEthForToken({
            amountWei,
            asset: receiveAsset,
            taker: address as `0x${string}`,
          });
          setStatus(`Borrow + swap to ${receiveAsset} done`);
        } catch (swapErr: any) {
          console.error(swapErr);
          setStatus(
            `Borrow en ETH ok, pero el swap a ${receiveAsset} falló: ${
              swapErr?.message || "Error desconocido"
            }`
          );
        }
      } else {
        setStatus("Borrow done");
      }
    } catch (err: any) {
      console.error(err);
      setStatus(err?.message || "Borrow failed");
    } finally {
      setScreenState("idle");
    }
  }

  async function handleRepay() {
    if (selectedVaultId === null) {
      setStatus("Select a vault first");
      return;
    }
    if (!repayAmount) {
      setStatus("Enter an amount to repay");
      return;
    }

    setScreenState("loading");
    setStatus("Repaying…");
    try {
      await repay(selectedVaultId, repayAmount);
      setRepayAmount("");
      await refreshVaults();
      setStatus("Repay done");
    } catch (err: any) {
      console.error(err);
      setStatus(err?.message || "Repay failed");
    } finally {
      setScreenState("idle");
    }
  }

  async function handleWithdraw() {
    if (selectedVaultId === null) {
      setStatus("Select a vault first");
      return;
    }
    if (!withdrawAmount) {
      setStatus("Enter an amount to withdraw");
      return;
    }

    setScreenState("loading");
    setStatus("Withdrawing…");
    try {
      await withdraw(selectedVaultId, withdrawAmount);
      setWithdrawAmount("");
      await refreshVaults();
      setStatus("Withdraw done");
    } catch (err: any) {
      console.error(err);
      setStatus(err?.message || "Withdraw failed");
    } finally {
      setScreenState("idle");
    }
  }

  // ---------- UI ----------
  return (
    <main className="min-h-screen bg-[#050505] text-[#f5f5f5]">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-neutral-400 hover:text-white">
              GranEverest
            </Link>
            <span className="text-xs text-neutral-500">/</span>
            <span className="text-sm font-medium">
              Loans (multi-vault · mainnet)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2 py-1 rounded border text-xs border-neutral-700">
              {CHAIN.name}
            </span>

            {address ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">
                  {address.slice(0, 6)}…{address.slice(-4)}
                </span>
                <button
                  onClick={() => disconnect()}
                  className="text-xs px-2 py-1 rounded border border-neutral-700 hover:bg-neutral-800"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                disabled={!primaryConnector || isConnecting}
                onClick={() =>
                  primaryConnector && connect({ connector: primaryConnector })
                }
                className="text-xs px-3 py-1 rounded border border-neutral-700 hover:bg-neutral-800 disabled:opacity-50"
              >
                {isConnecting ? "Connecting…" : "Connect wallet"}
              </button>
            )}
          </div>
        </header>

        {isWrongNetwork && (
          <div className="border border-yellow-600 bg-yellow-950/40 text-xs text-yellow-200 px-3 py-2 rounded">
            <div className="flex items-center justify-between gap-2">
              <span>
                Wrong network. Switch to <b>{CHAIN.name}</b>.
              </span>
              {switchChain && (
                <button
                  onClick={() => switchChain({ chainId: CHAIN.id })}
                  className="px-2 py-1 text-xs border border-yellow-500 rounded hover:bg-yellow-900/60"
                >
                  Switch
                </button>
              )}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="grid grid-cols-1 md:grid-cols-[240px,minmax(0,1fr)] gap-6">
          {/* Sidebar: Vault list */}
          <aside className="border border-neutral-800 rounded-xl p-4 bg-black/40">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold tracking-wide text-neutral-300">
                My vaults
              </span>
              <button
                onClick={handleCreateVault}
                disabled={!address || isWrongNetwork || screenState === "loading"}
                className="text-[11px] px-2 py-1 rounded border border-neutral-700 hover:bg-neutral-800 disabled:opacity-40"
              >
                + New
              </button>
            </div>

            {!address && (
              <p className="text-[11px] text-neutral-500">
                Connect your wallet to create vaults.
              </p>
            )}

            {address && vaults.length === 0 && (
              <p className="text-[11px] text-neutral-500">
                No vaults yet. Create your first one.
              </p>
            )}

            <div className="mt-2 flex flex-col gap-1">
              {vaults.map((v) => (
                <button
                  key={v.vaultId}
                  onClick={() => setSelectedVaultId(v.vaultId)}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-[11px] ${
                    selectedVaultId === v.vaultId
                      ? "border-neutral-200 bg-neutral-900"
                      : "border-neutral-800 bg-black/40 hover:border-neutral-500"
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">Vault #{v.vaultId}</span>
                    <span className="text-[10px] text-neutral-500">
                      LTV&nbsp;
                      {Number(v.collateral) === 0
                        ? "0%"
                        : `${(
                            (Number(v.debt) / Number(v.collateral)) *
                            100
                          ).toFixed(1)}%`}
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] text-neutral-400">
                    Collat: {v.collateralEth} ETH
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    Debt: {v.debtEth} ETH
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {/* Main card */}
          <section className="border border-neutral-800 rounded-xl p-5 bg-black/40 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-sm font-semibold tracking-wide">
                  ETH multi-vault
                </h1>
                <p className="text-[11px] text-neutral-400">
                  0% interest · Max LTV 70% · No liquidation. Debt unit: ETH.
                </p>
                <p className="text-[10px] text-neutral-500 mt-1">
                  Contract: {contractAddress.slice(0, 8)}…
                  {contractAddress.slice(-4)}
                </p>
              </div>
              <button
                onClick={refreshVaults}
                disabled={screenState === "loading"}
                className="text-[11px] px-2 py-1 rounded border border-neutral-700 hover:bg-neutral-800 disabled:opacity-40"
              >
                Refresh
              </button>
            </div>

            {selectedVault ? (
              <>
                {/* Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                  <div className="border border-neutral-800 rounded-lg p-3">
                    <div className="text-neutral-500 mb-1">Collateral</div>
                    <div className="text-sm">
                      {selectedVault.collateralEth}{" "}
                      <span className="text-xs">ETH</span>
                    </div>
                  </div>
                  <div className="border border-neutral-800 rounded-lg p-3">
                    <div className="text-neutral-500 mb-1">Debt</div>
                    <div className="text-sm">
                      {selectedVault.debtEth}{" "}
                      <span className="text-xs">ETH</span>
                    </div>
                  </div>
                  <div className="border border-neutral-800 rounded-lg p-3">
                    <div className="text-neutral-500 mb-1">LTV</div>
                    <div className="text-sm">{ltvPercent}%</div>
                  </div>
                  <div className="border border-neutral-800 rounded-lg p-3">
                    <div className="text-neutral-500 mb-1">
                      Max extra borrow
                    </div>
                    <div className="text-sm">
                      {maxBorrowEth} <span className="text-xs">ETH</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                  {/* Deposit */}
                  <div className="border border-neutral-800 rounded-lg p-4 flex flex-col gap-3">
                    <div className="font-semibold text-xs">Deposit</div>
                    <input
                      type="number"
                      min="0"
                      step="0.0001"
                      placeholder="Amount in ETH"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full rounded border border-neutral-700 bg-black/40 px-3 py-2 text-xs outline-none focus:border-neutral-300"
                    />
                    <button
                      onClick={handleDeposit}
                      disabled={screenState === "loading"}
                      className="w-full text-xs px-3 py-2 rounded border border-neutral-600 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40"
                    >
                      Deposit to vault
                    </button>
                  </div>

                  {/* Borrow */}
                  <div className="border border-neutral-800 rounded-lg p-4 flex flex-col gap-3">
                    <div className="font-semibold text-xs">Borrow</div>

                    {/* selector de asset de salida */}
                    <div className="flex items-center justify-between text-[10px] text-neutral-500">
                      <span>Receive asset</span>
                      <select
                        value={receiveAsset}
                        onChange={(e) =>
                          setReceiveAsset(e.target.value as ReceiveAsset)
                        }
                        className="bg-black/40 border border-neutral-700 rounded px-2 py-1 text-[10px] outline-none"
                      >
                        <option value="ETH">ETH</option>
                        <option value="USDC">USDC</option>
                        <option value="USDT">USDT</option>
                        <option value="DAI">DAI</option>
                      </select>
                    </div>

                    <input
                      type="number"
                      min="0"
                      step="0.0001"
                      placeholder="Amount in ETH"
                      value={borrowAmount}
                      onChange={(e) => setBorrowAmount(e.target.value)}
                      className="w-full rounded border border-neutral-700 bg-black/40 px-3 py-2 text-xs outline-none focus:border-neutral-300"
                    />
                    <div className="flex justify-between text-[10px] text-neutral-500">
                      <span>Max: {maxBorrowEth} ETH</span>
                      <button
                        type="button"
                        onClick={() => setBorrowAmount(maxBorrowEth)}
                        className="underline hover:text-neutral-300"
                      >
                        Use max
                      </button>
                    </div>
                    <button
                      onClick={handleBorrow}
                      disabled={screenState === "loading"}
                      className="w-full text-xs px-3 py-2 rounded border border-neutral-600 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40"
                    >
                      Borrow (0% interest)
                    </button>
                  </div>

                  {/* Repay */}
                  <div className="border border-neutral-800 rounded-lg p-4 flex flex-col gap-3">
                    <div className="font-semibold text-xs">Repay</div>
                    <input
                      type="number"
                      min="0"
                      step="0.0001"
                      placeholder="Amount in ETH"
                      value={repayAmount}
                      onChange={(e) => setRepayAmount(e.target.value)}
                      className="w-full rounded border border-neutral-700 bg-black/40 px-3 py-2 text-xs outline-none focus:border-neutral-300"
                    />
                    <div className="flex justify-between text-[10px] text-neutral-500">
                      <span>Current debt: {selectedVault.debtEth} ETH</span>
                      <button
                        type="button"
                        onClick={() =>
                          setRepayAmount(selectedVault.debtEth)
                        }
                        className="underline hover:text-neutral-300"
                      >
                        Repay all
                      </button>
                    </div>
                    <button
                      onClick={handleRepay}
                      disabled={screenState === "loading"}
                      className="w-full text-xs px-3 py-2 rounded border border-neutral-600 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40"
                    >
                      Repay
                    </button>
                  </div>

                  {/* Withdraw */}
                  <div className="border border-neutral-800 rounded-lg p-4 flex flex-col gap-3">
                    <div className="font-semibold text-xs">Withdraw</div>
                    <input
                      type="number"
                      min="0"
                      step="0.0001"
                      placeholder="Amount in ETH"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full rounded border border-neutral-700 bg-black/40 px-3 py-2 text-xs outline-none focus:border-neutral-300"
                    />
                    <div className="flex justify-between text-[10px] text-neutral-500">
                      <span>Collateral: {selectedVault.collateralEth} ETH</span>
                    </div>
                    <button
                      onClick={handleWithdraw}
                      disabled={screenState === "loading"}
                      className="w-full text-xs px-3 py-2 rounded border border-neutral-600 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40"
                    >
                      Withdraw collateral
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-[11px] text-neutral-500">
                {address
                  ? "Create a vault on the left to start."
                  : "Connect your wallet to create a vault."}
              </div>
            )}

            {status && (
              <div className="text-[11px] text-neutral-400 border border-neutral-800 rounded-md px-3 py-2">
                {status}
              </div>
            )}

            <div className="mt-2 text-[10px] text-neutral-500">
              No liquidation risk. Max LTV hard-coded at 70%. Fees: 0.25% on
              deposit & withdrawal. Borrow/repay have no protocol fee (gas only).
            </div>
          </section>
        </div>

        <footer className="mt-4 text-[10px] text-neutral-600 text-center pb-4">
          © {new Date().getFullYear()} GranEverest · Base · Multi-vault beta
        </footer>
      </div>
    </main>
  );
}
