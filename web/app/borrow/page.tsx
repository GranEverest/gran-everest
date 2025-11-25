// web/app/borrow/page.tsx
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

// -------- Theme hook (igual que landing/trust, default LIGHT) --------
function useThemeBoot() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("geTheme");
      const prefersDark =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-color-scheme: dark)").matches;

      const isDark = saved ? saved === "dark" : !!prefersDark;
      setDark(isDark);
      document.documentElement.setAttribute(
        "data-theme",
        isDark ? "dark" : "light"
      );
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      document.documentElement.setAttribute(
        "data-theme",
        dark ? "dark" : "light"
      );
      localStorage.setItem("geTheme", dark ? "dark" : "light");
    } catch {
      // ignore
    }
  }, [dark]);

  return { dark, setDark };
}

// ---- storage keys para nombres / ocultos ----
const STORAGE_VAULT_NAMES = "geVaultNames";
const STORAGE_HIDDEN_VAULTS = "geHiddenVaults";

// ---------------------------------------------------------------------
// Wrapper con providers
// ---------------------------------------------------------------------
export default function BorrowPage() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <BorrowScreen />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// ---------------------------------------------------------------------
// Pantalla real
// ---------------------------------------------------------------------
function BorrowScreen() {
  const { dark, setDark } = useThemeBoot();

  const { address } = useAccount();
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

  // nombres / ocultos (solo UI, localStorage)
  const [vaultNames, setVaultNames] = useState<Record<number, string>>({});
  const [hiddenVaultIds, setHiddenVaultIds] = useState<number[]>([]);
  const [showHidden, setShowHidden] = useState(false);

  // modales
  const [renameTargetId, setRenameTargetId] = useState<number | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [hideTargetId, setHideTargetId] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // cargar estado UI desde localStorage
  useEffect(() => {
    try {
      const namesRaw = localStorage.getItem(STORAGE_VAULT_NAMES);
      if (namesRaw) {
        setVaultNames(JSON.parse(namesRaw));
      }
      const hiddenRaw = localStorage.getItem(STORAGE_HIDDEN_VAULTS);
      if (hiddenRaw) {
        const arr = JSON.parse(hiddenRaw);
        if (Array.isArray(arr)) {
          setHiddenVaultIds(arr);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // persistir
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_VAULT_NAMES, JSON.stringify(vaultNames));
    } catch {
      // ignore
    }
  }, [vaultNames]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_HIDDEN_VAULTS,
        JSON.stringify(hiddenVaultIds)
      );
    } catch {
      // ignore
    }
  }, [hiddenVaultIds]);

  const primaryConnector = connectors[0];

  const isWrongNetwork =
    !!address && typeof chainId === "number" && chainId !== CHAIN.id;

  const selectedVault: VaultView | undefined =
    selectedVaultId === null
      ? undefined
      : vaults.find((v) => v.vaultId === selectedVaultId);

  const ltvPercent = (() => {
    if (!selectedVault) return "0";
    const collateralNum = Number(selectedVault.collateral);
    if (!collateralNum) return "0";
    const debtNum = Number(selectedVault.debt);
    const num = debtNum / collateralNum;
    return (num * 100).toFixed(2);
  })();

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

      // 1) Borrow en ETH del vault
      await borrow(selectedVaultId, amountEthStr);
      setBorrowAmount("");
      await refreshVaults();

      // 2) Swap opcional
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
            `Borrow in ETH done, but swap to ${receiveAsset} failed: ${
              swapErr?.message || "Unknown error"
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

  // ---- helpers rename/hide ----
  function labelForVault(v: VaultView): string {
    return vaultNames[v.vaultId] ?? `Vault #${v.vaultId}`;
  }

  function openRenameModal(v: VaultView) {
    const current = labelForVault(v);
    setRenameTargetId(v.vaultId);
    setRenameDraft(current);
    setHideTargetId(null);
  }

  function applyRename() {
    if (renameTargetId === null) return;
    const trimmed = renameDraft.trim();
    setVaultNames((prev) => ({
      ...prev,
      [renameTargetId]: trimmed || `Vault #${renameTargetId}`,
    }));
    setRenameTargetId(null);
    setRenameDraft("");
  }

  function cancelRename() {
    setRenameTargetId(null);
    setRenameDraft("");
  }

  function openHideModal(vaultId: number) {
    setHideTargetId(vaultId);
    setRenameTargetId(null);
  }

  function applyHide() {
    if (hideTargetId === null) return;
    setHiddenVaultIds((prev) =>
      prev.includes(hideTargetId) ? prev : [...prev, hideTargetId]
    );
    setHideTargetId(null);
  }

  function cancelHide() {
    setHideTargetId(null);
  }

  function unhideVault(vaultId: number) {
    setHiddenVaultIds((prev) => prev.filter((id) => id !== vaultId));
  }

  if (!mounted) return null;

  // vaults con estado de UI mezclado
  const vaultsWithUi = vaults.map((v) => ({
    ...v,
    uiLabel: labelForVault(v),
    uiHidden: hiddenVaultIds.includes(v.vaultId),
  }));

  const displayedVaults = vaultsWithUi.filter((v) =>
    showHidden ? true : !v.uiHidden
  );

  const hasOverlay = renameTargetId !== null || hideTargetId !== null;

  // ---------- UI ----------
  return (
    <>
      {/* NAVBAR */}
      <nav className="nav">
        <Link className="brand" href="/">
          GranEverest
        </Link>
        <div className="nav-right">
          <Link href="/docs" className="pill">
            Docs
          </Link>
          <Link href="/trust" className="pill">
            Trust
          </Link>
          <button
            type="button"
            className="pill"
            onClick={() => setDark((v) => !v)}
          >
            {dark ? "Light" : "Dark"}
          </button>
        </div>
      </nav>

      <main className="wrap">
        {/* Top row: network + connect */}
        <section className="borrow-top">
          <div className="borrow-network small">
            <span className="badge">{CHAIN.name}</span>
            <span className="muted">
              &nbsp;· Debt unit: ETH · Max LTV 70% · No liquidations
            </span>
          </div>
          <div className="borrow-connect">
            {address ? (
              <>
                <span className="wallet-chip small">
                  {address.slice(0, 6)}…{address.slice(-4)}
                </span>
                <button
                  onClick={() => disconnect()}
                  className="btn-primary small"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                disabled={!primaryConnector || isConnecting}
                onClick={() =>
                  primaryConnector && connect({ connector: primaryConnector })
                }
                className="btn-primary small"
              >
                {isConnecting ? "Connecting…" : "Connect wallet"}
              </button>
            )}
          </div>
        </section>

        {isWrongNetwork && (
          <div className="banner-warning small">
            <span>
              Wrong network. Switch to <b>{CHAIN.name}</b>.
            </span>
            {switchChain && (
              <button
                onClick={() => switchChain({ chainId: CHAIN.id })}
                className="btn-primary small"
              >
                Switch
              </button>
            )}
          </div>
        )}

        {/* Grid: Vaults + My vaults */}
        <section className="borrow-grid">
          {/* Vaults definition */}
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
                  Network: <span className="muted">{CHAIN.name}</span>
                </div>
                <div>
                  Contract:{" "}
                  <code>
                    {contractAddress.slice(0, 8)}…
                    {contractAddress.slice(-4)}
                  </code>
                </div>
              </div>
              <button
                onClick={handleCreateVault}
                disabled={
                  !address || isWrongNetwork || screenState === "loading"
                }
                className="btn-primary small"
              >
                + Create ETH vault
              </button>
              <p className="small muted">
                When you create a vault, it will appear under{" "}
                <strong>My vaults</strong>.
              </p>
            </div>
          </article>

          {/* My vaults list */}
          <article className="card">
            <div className="my-vaults-header">
              <h2>My vaults</h2>
              {address && vaultsWithUi.length > 0 && (
                <label className="show-hidden-toggle small">
                  <input
                    type="checkbox"
                    checked={showHidden}
                    onChange={(e) => setShowHidden(e.target.checked)}
                  />
                  <span>Show hidden vaults</span>
                </label>
              )}
            </div>

            {!address && (
              <p className="small muted">
                Connect your wallet to create and manage vaults.
              </p>
            )}

            {address && vaultsWithUi.length === 0 && (
              <p className="small muted">
                You don&apos;t have any vaults yet. Use{" "}
                <strong>&ldquo;+ Create ETH vault&rdquo;</strong> to open your
                first one.
              </p>
            )}

            {address && displayedVaults.length > 0 && (
              <div className="vault-list">
                {displayedVaults.map((v) => (
                  <button
                    key={v.vaultId}
                    onClick={() => setSelectedVaultId(v.vaultId)}
                    className={
                      selectedVaultId === v.vaultId
                        ? "vault-list-item vault-list-item--active"
                        : "vault-list-item"
                    }
                  >
                    <div className="vault-list-main">
                      <span className="vault-id">{v.uiLabel}</span>
                      <span className="vault-ltv small">
                        LTV{" "}
                        {Number(v.collateral) === 0
                          ? "0%"
                          : `${(
                              (Number(v.debt) / Number(v.collateral)) *
                              100
                            ).toFixed(1)}%`}
                      </span>
                    </div>
                    <div className="vault-list-sub small">
                      <span>Collateral: {v.collateralEth} ETH</span>
                      <span>Debt: {v.debtEth} ETH</span>
                    </div>
                    <div className="vault-list-actions small">
                      <button
                        type="button"
                        className="vault-inline-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openRenameModal(v);
                        }}
                      >
                        Rename
                      </button>
                      <span className="vault-inline-separator">·</span>
                      {v.uiHidden ? (
                        <button
                          type="button"
                          className="vault-inline-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            unhideVault(v.vaultId);
                          }}
                        >
                          Unhide
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="vault-inline-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openHideModal(v.vaultId);
                          }}
                        >
                          Hide
                        </button>
                      )}
                      {v.uiHidden && (
                        <span className="vault-hidden-tag small">Hidden</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </article>
        </section>

        {/* Selected vault details */}
        <section className="card card-full">
          <header className="card-header">
            <div>
              <h2>ETH vault details</h2>
              <p className="small muted">
                Deposit ETH as collateral, borrow at 0% interest, repay to
                withdraw. Max LTV 70%.
              </p>
            </div>
            <button
              onClick={refreshVaults}
              disabled={screenState === "loading"}
              className="btn-primary small"
            >
              Refresh
            </button>
          </header>

          {!selectedVault ? (
            <p className="small muted">
              {address
                ? "Select a vault from “My vaults” to see metrics and actions."
                : "Connect your wallet and create a vault to start."}
            </p>
          ) : (
            <>
              {/* Metrics */}
              <div className="metrics-grid">
                <div className="metric">
                  <div className="metric-label small">Collateral</div>
                  <div className="metric-value">
                    {selectedVault.collateralEth} <span>ETH</span>
                  </div>
                </div>
                <div className="metric">
                  <div className="metric-label small">Debt</div>
                  <div className="metric-value">
                    {selectedVault.debtEth} <span>ETH</span>
                  </div>
                </div>
                <div className="metric">
                  <div className="metric-label small">LTV</div>
                  <div className="metric-value">{ltvPercent}%</div>
                </div>
                <div className="metric">
                  <div className="metric-label small">Max extra borrow</div>
                  <div className="metric-value">
                    {maxBorrowEth} <span>ETH</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="actions-grid">
                {/* Deposit */}
                <div className="action-block">
                  <div className="action-title">Deposit</div>
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    placeholder="Amount in ETH"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="input"
                  />
                  <button
                    onClick={handleDeposit}
                    disabled={screenState === "loading"}
                    className="btn-primary small"
                  >
                    Deposit collateral
                  </button>
                </div>

                {/* Borrow */}
                <div className="action-block">
                  <div className="action-title">Borrow</div>
                  <div className="action-row small muted">
                    <span>Receive asset</span>
                    <select
                      value={receiveAsset}
                      onChange={(e) =>
                        setReceiveAsset(e.target.value as ReceiveAsset)
                      }
                      className="select"
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
                    className="input"
                  />
                  <div className="action-row small muted">
                    <span>Max: {maxBorrowEth} ETH</span>
                    <button
                      type="button"
                      onClick={() => setBorrowAmount(maxBorrowEth)}
                      className="link-button"
                    >
                      Use max
                    </button>
                  </div>
                  <button
                    onClick={handleBorrow}
                    disabled={screenState === "loading"}
                    className="btn-primary small"
                  >
                    Borrow at 0% interest
                  </button>
                </div>

                {/* Repay */}
                <div className="action-block">
                  <div className="action-title">Repay</div>
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    placeholder="Amount in ETH"
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    className="input"
                  />
                  <div className="action-row small muted">
                    <span>Current debt: {selectedVault.debtEth} ETH</span>
                    <button
                      type="button"
                      onClick={() => setRepayAmount(selectedVault.debtEth)}
                      className="link-button"
                    >
                      Repay all
                    </button>
                  </div>
                  <button
                    onClick={handleRepay}
                    disabled={screenState === "loading"}
                    className="btn-primary small"
                  >
                    Repay
                  </button>
                </div>

                {/* Withdraw */}
                <div className="action-block">
                  <div className="action-title">Withdraw</div>
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    placeholder="Amount in ETH"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="input"
                  />
                  <div className="action-row small muted">
                    <span>
                      Collateral: {selectedVault.collateralEth} ETH (respect
                      70% LTV when withdrawing)
                    </span>
                  </div>
                  <button
                    onClick={handleWithdraw}
                    disabled={screenState === "loading"}
                    className="btn-primary small"
                  >
                    Withdraw collateral
                  </button>
                </div>
              </div>
            </>
          )}

          {status && <div className="status-box small">{status}</div>}

          <p className="small muted">
            No liquidation risk. Max LTV hard-coded at 70%. Fees: 0.25% on
            deposit &amp; withdrawal only. Borrow &amp; repay have no protocol
            fee (gas only).
          </p>
        </section>
      </main>

      {/* Modales rename / hide */}
      {hasOverlay && (
        <div className="modal-backdrop">
          {renameTargetId !== null && (
            <div className="modal">
              <h3 className="modal-title">Rename vault</h3>
              <p className="small muted" style={{ marginBottom: 8 }}>
                Set a custom name for this vault.
              </p>
              <input
                autoFocus
                className="input modal-input"
                value={renameDraft}
                onChange={(e) => setRenameDraft(e.target.value)}
                placeholder={`Vault #${renameTargetId}`}
              />
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary small"
                  onClick={cancelRename}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary small"
                  onClick={applyRename}
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {hideTargetId !== null && (
            <div className="modal">
              <h3 className="modal-title">Hide vault?</h3>
              <p className="small muted" style={{ marginBottom: 12 }}>
                This only hides the vault in your browser. It does not delete or
                close it on-chain. You can reveal it again with &ldquo;Show
                hidden vaults&rdquo;.
              </p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary small"
                  onClick={cancelHide}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary small"
                  onClick={applyHide}
                >
                  Hide vault
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Styles (tokens + app-specific) */}
      <style jsx global>{`
        :root {
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
        html[data-theme="light"] {
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
        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: default;
        }

        .banner-warning {
          margin-top: 10px;
          padding: 8px 10px;
          border-radius: 10px;
          border: 1px solid #b38a00;
          background: rgba(179, 138, 0, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
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
          background: rgba(0, 0, 0, 0.1);
        }

        html[data-theme="light"] .product-card {
          background: rgba(0, 0, 0, 0.02);
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

        .my-vaults-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .vault-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 8px;
        }

        .vault-list-item {
          width: 100%;
          text-align: left;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--card);
          padding: 8px 10px;
          cursor: pointer;
        }

        .vault-list-item--active {
          border-color: #cccccc;
        }

        .vault-list-main {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }

        .vault-list-sub {
          display: flex;
          justify-content: space-between;
          gap: 6px;
          margin-top: 2px;
        }

        .vault-id {
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
        }

        .vault-ltv {
          font-size: 12px;
        }

        .vault-list-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 4px;
        }

        .vault-inline-button {
          border: none;
          background: none;
          padding: 0;
          font-size: 12px;
          color: var(--text);
          cursor: pointer;
        }

        .vault-inline-button:hover {
          opacity: 0.8;
        }

        .vault-inline-separator {
          opacity: 0.5;
        }

        .vault-hidden-tag {
          margin-left: 6px;
          padding: 1px 6px;
          border-radius: 999px;
          border: 1px solid var(--border);
        }

        .show-hidden-toggle {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }

        .show-hidden-toggle input {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: var(--btn-bg);
          margin: 0;
          cursor: pointer;
        }

        .show-hidden-toggle input:checked {
          box-shadow: 0 0 0 1px var(--border);
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

        .input {
          width: 100%;
          border-radius: 999px;
          border: 1px solid var(--border);
          padding: 6px 10px;
          background: var(--card); /* dark: card (negro), light se override abajo */
          color: var(--text);
          font-size: 13px;
        }

        html[data-theme="light"] .input {
          background: #ffffff;
          color: #111111;
        }

        .select {
          border-radius: 999px;
          border: 1px solid var(--border);
          padding: 4px 10px;
          background: var(--btn-bg);
          color: var(--btn-fg);
          font-size: 13px;
        }

        .link-button {
          background: none;
          border: none;
          padding: 0;
          color: var(--link);
          cursor: pointer;
          text-decoration: underline;
          font-size: 12px;
        }

        .status-box {
          margin-bottom: 8px;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: rgba(0, 0, 0, 0.12);
        }

        html[data-theme="light"] .status-box {
          background: rgba(0, 0, 0, 0.03);
        }

        /* Modales */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 40;
        }

        .modal {
          width: 100%;
          max-width: 360px;
          background: var(--card);
          border-radius: 16px;
          border: 1px solid var(--border);
          padding: 18px 18px 16px;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
        }

        .modal-title {
          margin: 0 0 6px;
          font-size: 16px;
        }

        .modal-input {
          margin-top: 4px;
        }

        .modal-actions {
          margin-top: 14px;
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
      `}</style>
    </>
  );
}
