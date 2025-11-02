"use client";

import Link from "next/link";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPublicClient, http, type Address } from "viem";
import { CHAIN } from "@/chain";
import { useVault, isPaused as vaultIsPaused } from "@/hooks/useVault";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const LOCALE = "en-US";
const USD_FMT = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const publicClient = createPublicClient({
  chain: CHAIN as any,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org"),
});

type HistItem = { t: number; action: "deposit" | "borrow" | "repay" | "withdraw"; amount: number };

const MOUNTAIN_ASCII = String.raw`
                                                                                     +           
                                                                                    =+                        
                                                                                   ===-                                                                                   
                                                                                  =+=----                                                                                 
                                                                                +++++---=--                                                                               
                                                                               ++**++--=-=-=                                                                              
                                                                             ++++++*=---==-=-                                                                             
                                                                            +++++***+--------=-                                                                           
                                                                          +++++******=---------=                                                                          
                                                                         ++++++******+=----------                                                                         
                                                                        ++*+++*+******=--------=--=                                                                       
                                                                      +++++**********+-----==------=                                                                      
                                                                     ++**+********++=-=----------------                                                                   
                                                                   =++**+*****+**+=---==------==-------=                                                                  
                                                                 =++++*#***********---=-==-----==------=-=                                                                
                                                                ++++*****++*#+***#**=-----=---=--===----=--                                                               
                                                               ++**+*+++******####*++=-----=-----=-==------=                                                              
                                                              ++*#**++**+*######*+--===-----=------===-------                                                             
                                                            =++***++*############=---===-----==---=-===--=--==                                                            
                                                          ++++***+######**#+###**=----=-=-----===----===--==---=                                                          
                                                         ++*+****######**+*##**###+-----==------==-----==--=-=----                                                         
                                                    +++++++*#*+#######*++###**#####*--------------++-----======+=----=                                                    
                                                 +++++++*++**+#######+**###*+#*######*=----------=-=+--==--=-===+=--=+=-=-                                                
                                                +#++++**+++++*###*##+#####***###########-----------===---=---====++++++---==                                              
                                              ++**#+=++=++++#**##**+####*#**#############=---------===+---=-====+*+++++=-----                                            
                                            ++*#******+++++**#*#+++#####*+#####*###########+--------===+=-----=++++++++==-----=                                          
                                           ***++#####*##**+*++*++####*#***######*##*########--------=-====-----=+++=++#+++=----=                                         
                                          ++++**########++++++*####***+**####*##############=---=-------===------==+++**+++++-----                                        
                                      +++*+++++###++##*++=+++#####*##+*###*###*##*##########+---==+++=---==-------=+++++++++=+=--===                                     
                                    *#*=-==+++=+++*+=++==+++#####+*++*#####*+*########%##%#++----=++*=-----=--------=+*+++++=++=---==-                                    
                                   *###+-----==+++++====+**####+*++++*#++#++++######%##==---=------=+++=-----==-=----=+++=+++++++----=-=                                  
                                 ######++=---------==++++++**++**+*+**+++++**########*##------------=++===------=---=--=++==+=++===--=+=--                                 
                               +######***#+---=+=--=--====+++++++*+**+++++*#########++###=----------===++=-----------===-====+=+++=-----====                              
                             +##########*+++*+==++--===--==++**++++++++++######*++==++*+--+-------===-=++++===--------==+=-=+==++=++------==-=                            
                           *##*##########**+##+-++++----=---===+++++++*########+-----------+*=---=-=++=-+++*+*+=-----=--==+===*+=+++++---------                           
                          ################**###*=-=+++==-===---=++++*###########+-----------=+*+-----==++=++*+++=---------=+=--=+++=++++----==---=                        
                        *#######*#########*+*###*=--==++=+-==+==+++++++**########+----=----==-+**+=--=--++****#***+---------===-==+++=+++=--====-==                       
                       *####*+*#####*+#####+=+####+=--==++++==+*+++++=++###########=--+++----=++##*+--+===+##**####*#*#=--------=--=+++=+++---======                      
                      ###############++###*#+++###++++=-==++*++++==+###########%#%##%+-++**+==-=++###+=+#++++*#####*###**#=--===-----=-++++++--==++==                     
                    #####**###########*++#####++*###++*#*+===+==*##########%#%%##%#####+=+=##+=++=+####++*###**##*###*##*#***==+++=------=++++==+=====                    
                   *#########%#########**################+#*++##%#################%############***####*##++*#######*##########*==++++==+==*#*##*+=+++==+                  
                 #*#######################+#################%%##############%%#%%##%##%##########*###*###++##*#########*#####**##++***###**+#***#++++++++                 
                #############%#%#%#%##%##########*###########%%%%%%#%#%##%%%##%%%##%##############*##*#########*#########**######%#*+###*##%#*#+###*#*##*+                
              *#######%#%##%%##%%#%#%%#%#######%#%#%###%#%%%#%%#%#%#%%%%#%#%%#%%#%%%%#%##%#%###%######*#################%#######%#############%############*              
            *######*##########*###############################*############################################*###*######*###############*#*###############*##+             
`;

const NETWORKS = {
  base: { hex: "0x2105", label: "Base" },
  baseSepolia: { hex: "0x14a34", label: "Base Sepolia" },
} as const;

export default function LoansPage() {
  const [darkMode, setDarkMode] = useState(true);

  // Wallet
  const [account, setAccount] = useState<Address | null>(null);
  useEffect(() => {
    if (!window?.ethereum) return;
    window.ethereum.request({ method: "eth_accounts" })
      .then((accs: string[]) => setAccount((accs?.[0] as Address) ?? null))
      .catch(() => setAccount(null));
    const onAccounts = (accs: string[]) => setAccount((accs?.[0] as Address) ?? null);
    window.ethereum.on?.("accountsChanged", onAccounts);
    return () => window.ethereum?.removeListener?.("accountsChanged", onAccounts);
  }, []);
  const connectWallet = async () => {
    if (!window?.ethereum) return alert("No wallet provider.");
    const accs: string[] = await window.ethereum.request({ method: "eth_requestAccounts" });
    setAccount((accs?.[0] as Address) ?? null);
  };
  const disconnectWallet = () => setAccount(null);

  // Vault hook
  const { state, loading, error, deposit, withdraw, borrow, repay, refresh } = useVault(account ?? undefined);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Network
  const [chainIdHex, setChainIdHex] = useState<string | null>(null);
  useEffect(() => {
    const check = async () => {
      try {
        const id = await window?.ethereum?.request({ method: "eth_chainId" });
        setChainIdHex(id ?? null);
      } catch { setChainIdHex(null); }
    };
    check();
    const onChain = (id: string) => setChainIdHex(id);
    window?.ethereum?.on?.("chainChanged", onChain);
    return () => window?.ethereum?.removeListener?.("chainChanged", onChain);
  }, []);
  const isOnBase = chainIdHex === NETWORKS.base.hex;
  const isOnBaseSepolia = chainIdHex === NETWORKS.baseSepolia.hex;

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2200); };

  // History
  const histKey = `ge:hist:${account ?? "no-account"}`;
  const [hist, setHist] = useState<HistItem[]>([]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(histKey);
    setHist(raw ? (() => { try { return JSON.parse(raw) as HistItem[]; } catch { return []; } })() : []);
  }, [histKey]);
  const pushHist = (i: HistItem) => {
    const next = [i, ...hist].slice(0, 100);
    setHist(next);
    if (typeof window !== "undefined") localStorage.setItem(histKey, JSON.stringify(next));
  };
  const [histExpanded, setHistExpanded] = useState(false);
  const shownHist = histExpanded ? hist : hist.slice(0, 5);

  // Inputs
  const [amount, setAmount] = useState<string>("");
  const [wdAmt, setWdAmt] = useState<string>("");
  const amtNum = Number(amount);
  const validAmount = Number.isFinite(amtNum) && amtNum > 0;
  const wdNum = Number(wdAmt);
  const validWd = Number.isFinite(wdNum) && wdNum > 0;

  // Derived
  const collateralEth = state?.collateralEth ?? 0;
  const borrowedEth = state?.borrowedEth ?? 0;
  const limitEth = state?.borrowLimitEth ?? 0;
  const price = state?.priceEthUsd ?? 0;
  const usd = (n: number) => USD_FMT.format(n * price);

  // Guards / pause
  const [lastBorrowBlock, setLastBorrowBlock] = useState<bigint | null>(null);
  const [currentBlock, setCurrentBlock] = useState<bigint | null>(null);
  const [overrideLoopGuard, setOverrideLoopGuard] = useState(false);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    let live = true;
    const poll = async () => {
      try {
        const [bn, p] = await Promise.all([publicClient.getBlockNumber(), vaultIsPaused()]);
        if (!live) return;
        setCurrentBlock(bn);
        setPaused(Boolean(p));
      } catch {}
    };
    poll();
    const id = setInterval(poll, 2500);
    return () => { live = false; clearInterval(id); };
  }, []);
  const sameBlockAsBorrow = lastBorrowBlock !== null && currentBlock !== null && lastBorrowBlock === currentBlock;

  // Actions
  const onDeposit = async () => {
    if (!validAmount) return showToast("Enter amount > 0");
    if (paused) return showToast("Vault is paused");
    if (sameBlockAsBorrow && !overrideLoopGuard) return showToast("Wait 1 block or override");
    const r = await deposit(amtNum);
    if (r?.ok === false) return showToast(r.error || "Deposit failed");
    pushHist({ t: Date.now(), action: "deposit", amount: amtNum });
    showToast("Deposit done");
  };
  const onRepay = async () => {
    if (!validAmount) return showToast("Enter amount > 0");
    if (paused) return showToast("Vault is paused");
    const r = await repay(amtNum);
    if (r?.ok === false) return showToast(r.error || "Repay failed");
    pushHist({ t: Date.now(), action: "repay", amount: amtNum });
    showToast("Repay done");
  };

  const [targetPct, setTargetPct] = useState<number>(0);
  const deltaToTargetEth = limitEth * (targetPct / 100) - borrowedEth;
  const onBorrowToTarget = async () => {
    const delta = Number(deltaToTargetEth.toFixed(6));
    if (Math.abs(delta) < 1e-9) return;
    if (paused) return showToast("Vault is paused");
    if (delta > 0) {
      if (borrowedEth + delta > limitEth + 1e-12) return showToast("Exceeds borrow limit");
      const r = await borrow(delta);
      if (r?.ok === false) return showToast(r.error || "Borrow failed");
      const bn = await publicClient.getBlockNumber();
      setLastBorrowBlock(bn);
      pushHist({ t: Date.now(), action: "borrow", amount: delta });
      showToast("Borrow done");
    } else {
      const r = await repay(Math.abs(delta));
      if (r?.ok === false) return showToast(r.error || "Repay failed");
      pushHist({ t: Date.now(), action: "repay", amount: Math.abs(delta) });
      showToast("Repay done");
    }
  };

  const repayNeededFor = (w: number) => {
    const newMax = Math.max(0, (collateralEth - w) * 0.7);
    return Math.max(0, borrowedEth - newMax);
    };
  const repayNeeded = validWd ? repayNeededFor(wdNum) : 0;
  const repayNeededAll = borrowedEth;

  const onRepayThenWithdraw = async () => {
    if (!validWd) return showToast("Enter a valid withdraw amount");
    if (paused) return showToast("Vault is paused");
    if (wdNum > collateralEth + 1e-12) return showToast("Exceeds collateral");
    if (repayNeeded > 1e-12) {
      const r1 = await repay(repayNeeded);
      if (r1?.ok === false) return showToast(r1.error || "Repay failed");
      pushHist({ t: Date.now(), action: "repay", amount: repayNeeded });
      showToast("Repay done");
    }
    const r2 = await withdraw(wdNum);
    if (r2?.ok === false) return showToast(r2.error || "Withdraw failed");
    pushHist({ t: Date.now(), action: "withdraw", amount: wdNum });
    showToast("Withdraw done");
  };

  const onWithdrawAllFlow = async () => {
    if (paused) return showToast("Vault is paused");
    if (collateralEth <= 0) return showToast("No collateral");
    if (borrowedEth > 1e-12) {
      const r1 = await repay(borrowedEth);
      if (r1?.ok === false) return showToast(r1.error || "Repay failed");
      pushHist({ t: Date.now(), action: "repay", amount: borrowedEth });
      showToast("Repay done");
    }
    const r2 = await withdraw(collateralEth);
    if (r2?.ok === false) return showToast(r2.error || "Withdraw failed");
    pushHist({ t: Date.now(), action: "withdraw", amount: collateralEth });
    showToast("Withdraw ALL done");
  };

  // UI helpers
  const connectedShort = useMemo(() => {
    if (!account) return "—";
    const a = account as string;
    return `${a.slice(0, 6)}...${a.slice(-4)}`;
  }, [account]);

  const hueFor = (p: number) =>
    p <= 40 ? 120 - (p / 40) * 60 : p <= 60 ? 60 - ((p - 40) / 20) * 30 : Math.max(0, 30 - ((p - 60) / 10) * 30);
  const sliderHue = hueFor(targetPct);
  const sliderColor = `hsl(${sliderHue}deg 70% 50%)`;

  const CARD_WIDTH = 420;

  // Dropdown connect/disconnect
  const [openMenu, setOpenMenu] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!btnRef.current) return;
      if (!btnRef.current.contains(e.target as Node)) setOpenMenu(false);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  return (
    <>
      <main className="relative min-h-screen overflow-x-hidden z-[5]">
        {/* HEADER */}
        <header
          style={{
            position: "fixed",
            top: 0, left: 0, width: "100%",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "0.7rem 1.5rem", zIndex: 1000,
          }}
        >
          <Link href="/" className="ge-logo" style={{ textDecoration: "none" }}>GranEverest</Link>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/" className="ge-btn small">← Home</Link>

            {/* Connect / Disconnect */}
            <div style={{ position: "relative" }}>
              <button
                ref={btnRef}
                onClick={() => (account ? setOpenMenu(v => !v) : connectWallet())}
                className="ge-btn"
                title={account ? "Wallet options" : "Connect wallet"}
              >
                {account ? "Connected" : "Connect Wallet"}
              </button>
              {account && openMenu && (
                <div
                  className="ge-rect"
                  style={{
                    position: "absolute", right: 0, top: "calc(100% + 6px)",
                    padding: 6, display: "grid", gap: 6, background: "var(--panel)", minWidth: 200, zIndex: 1100,
                  }}
                >
                  <div style={{ fontSize: ".85rem", opacity: 0.9, padding: "4px 6px", textAlign: "left" }}>{connectedShort}</div>
                  <button onClick={disconnectWallet} className="ge-btn small" style={{ width: "100%" }}>Disconnect</button>
                </div>
              )}
            </div>

            {/* Network label */}
            <button
              disabled
              className="ge-rect"
              style={{
                cursor: "default",
                color: isOnBase || isOnBaseSepolia ? "#22c55e" : "#f87171",
                minWidth: 110, justifyContent: "center",
              }}
              title={chainIdHex ?? "No wallet"}
            >
              {chainIdHex ? (isOnBase ? "Base" : isOnBaseSepolia ? "Base Sepolia" : `Net ${chainIdHex}`) : "No wallet"}
            </button>

            <button onClick={() => setDarkMode(!darkMode)} className="ge-btn" style={{ width: 160, justifyContent: "flex-start" }}>
              <span className="ge-dot" style={{ background: darkMode ? "#fff" : "#000" }} />
              {darkMode ? "Light" : "Dark"}
            </button>
          </div>
        </header>

        {/* MOUNTAIN (centrado) */}
        <div style={{ marginTop: "5.25rem", width: "100%", display: "flex", justifyContent: "center" }}>
          <div className="ge-mountain-wrap" style={{ marginTop: 0 }}>
            <pre className="ge-mountain" aria-hidden="true">{MOUNTAIN_ASCII}</pre>
          </div>
        </div>

        {/* TITLE + SUBTITLE centrados */}
        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <h1 style={{ fontWeight: 500, letterSpacing: "-0.02em", margin: "0.2rem 0 0.2rem", fontSize: "2.4rem" }}>Loans</h1>
        </div>
        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <p style={{ marginBottom: "0.35rem", fontSize: "0.9rem", opacity: 0.9 }}>ETH Vault</p>
        </div>
        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <p style={{ marginBottom: "1rem", fontSize: "0.9rem" }}>Connected: {connectedShort}</p>
        </div>

        {/* ERROR (si hay) */}
        {error && (
          <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <p style={{ color: "#f87171", marginBottom: 10, maxWidth: CARD_WIDTH, textAlign: "left" }}>{error}</p>
          </div>
        )}

        {/* CARD centrada */}
        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <div
            style={{
              border: "1px solid var(--border)", borderRadius: 10, padding: 16, marginTop: 8,
              width: CARD_WIDTH, maxWidth: "92vw", textAlign: "left", background: "var(--panel)", boxSizing: "border-box",
            }}
          >
            {paused && (
              <div className="mt-1 mb-3 rounded-lg border px-3 py-2 text-sm opacity-90">
                Vault is currently paused by the admin. Deposits, borrows, repays and withdrawals are temporarily disabled.
              </div>
            )}
            {loading && <p className="text-sm" style={{ opacity: 0.7 }}>Processing…</p>}

            {/* A — Deposit / Repay */}
            <section style={{ display: "grid", gap: 10 }}>
              <label className="text-sm" style={{ opacity: 0.95 }} htmlFor="amt">Amount (ETH)</label>
              <input
                id="amt" type="number" min="0" step="any" placeholder="0.00"
                value={amount} onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2 border border-gray-400 rounded bg-transparent text-center"
              />
              <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                <button
                  className="ge-btn" style={{ width: "49%" }} onClick={onDeposit}
                  disabled={loading || !validAmount || !account || paused || (sameBlockAsBorrow && !overrideLoopGuard)}
                  title={paused ? "Paused" : sameBlockAsBorrow && !overrideLoopGuard ? "Wait 1 block or enable override" : undefined}
                >
                  {sameBlockAsBorrow && !overrideLoopGuard ? "Wait 1 block…" : "Deposit"}
                </button>
                <button className="ge-btn" style={{ width: "49%" }} onClick={onRepay} disabled={loading || !validAmount || !account || paused}>
                  Repay
                </button>
              </div>
              {sameBlockAsBorrow && (
                <label className="mt-1 flex items-center gap-2 text-sm opacity-80">
                  <input type="checkbox" checked={overrideLoopGuard} onChange={(e) => setOverrideLoopGuard(e.target.checked)} />
                  I know what I’m doing (override guard)
                </label>
              )}
            </section>

            <hr style={{ border: "none", borderTop: "1px solid #333", margin: "0.9rem 0" }} />

            {/* B — Borrow target */}
            <section>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", opacity: 0.9, marginBottom: 6 }}>
                <span>Borrow target</span><span>{targetPct}% of limit</span>
              </div>
              <input
                aria-label="Borrow target percentage" type="range" min={0} max={70} step={1}
                value={targetPct} onChange={(e) => setTargetPct(Number(e.target.value))}
                className="ge-range" style={{ accentColor: `hsl(${sliderHue}deg 70% 50%)` } as React.CSSProperties}
              />
              <button onClick={onBorrowToTarget} className="ge-btn" style={{ width: "100%", marginTop: 10 }} disabled={loading || !account || paused}>
                Borrow
              </button>
            </section>

            <hr style={{ border: "none", borderTop: "1px solid #333", margin: "0.9rem 0" }} />

            {/* C — Métricas */}
            <section style={{ display: "grid", gap: 6 }}>
              <p><b>Collateral:</b> {collateralEth.toFixed(4)} ETH (${usd(collateralEth)})</p>
              <p><b>Debt:</b> {borrowedEth.toFixed(4)} ETH (${usd(borrowedEth)})</p>
              <p><b>Max borrow:</b> {limitEth.toFixed(4)} ETH (${usd(limitEth)})</p>
              <p><b>Available to borrow:</b> {Math.max(limitEth - borrowedEth, 0).toFixed(4)} ETH (${usd(Math.max(limitEth - borrowedEth, 0))})</p>
              <div className="ge-bar" style={{ marginTop: 6 }}>
                <span
                  style={{
                    width: `${Math.min((borrowedEth / Math.max(limitEth, 1e-9)) * 100, 100).toFixed(2)}%`,
                    background:
                      borrowedEth / Math.max(limitEth, 1e-9) < 0.4 ? "#16a34a" :
                      borrowedEth / Math.max(limitEth, 1e-9) < 0.6 ? "#eab308" :
                      borrowedEth / Math.max(limitEth, 1e-9) <= 0.7 ? "#f59e0b" : "#ef4444",
                  }}
                />
              </div>
            </section>

            <hr style={{ border: "none", borderTop: "1px solid #333", margin: "0.9rem 0" }} />

            {/* D — Withdraw */}
            <section style={{ display: "grid", gap: 10 }}>
              <div className="row" style={{ alignItems: "center" }}>
                <label htmlFor="wd" style={{ minWidth: 90 }}>Withdraw</label>
                <input
                  id="wd" type="number" min="0" step="any" placeholder="Amount (ETH)"
                  value={wdAmt} onChange={(e) => setWdAmt(e.target.value)}
                  className="flex-1 p-2 border border-gray-400 rounded bg-transparent text-right"
                />
              </div>

              {validWd ? (
                <>
                  <p style={{ fontSize: "0.9rem", opacity: 0.9 }}>
                    To withdraw <b>{wdNum.toFixed(6)} ETH</b>, you must first repay at least <b>{repayNeededFor(wdNum).toFixed(6)} ETH</b> (if any) to keep LTV ≤ 70%.
                  </p>
                  <button onClick={onRepayThenWithdraw} className="ge-btn" style={{ width: "100%" }} disabled={loading || !validWd || !account || paused}>
                    Withdraw
                  </button>
                </>
              ) : (
                wdAmt && <p style={{ color: "#f87171", fontSize: "0.85rem" }}>Enter a valid amount ≤ your collateral</p>
              )}

              <div style={{ marginTop: 6, padding: 10, border: "1px dashed #555", borderRadius: 8, background: "transparent", fontSize: "0.9rem" }}>
                <div style={{ marginBottom: 6 }}>
                  To withdraw <b>100% of your collateral</b>, you must first fully repay your outstanding debt: <b>{repayNeededAll.toFixed(6)} ETH</b>. The app can do this automatically for you.
                </div>
                <button onClick={onWithdrawAllFlow} className="ge-btn" style={{ width: "100%" }} disabled={loading || collateralEth <= 0 || !account || paused}>
                  Withdraw ALL
                </button>
              </div>
            </section>

            <hr style={{ border: "none", borderTop: "1px solid #333", margin: "0.9rem 0" }} />

            <p style={{ fontSize: "0.9rem", opacity: 0.95 }}>
              Protocol fee: <b>0.25%</b> on <b>deposit</b> and <b>withdrawal</b> only. Borrow and repay have no protocol fee.
            </p>
            <p style={{ fontSize: "0.85rem", opacity: 0.85 }}>
              Users pay their own L2 gas. ETH↔WETH wrapping/unwrapping is 1:1 (no conversion fee — gas only). Any third-party costs are paid by the user.
            </p>

            <div className="mt-3 flex justify-center">
              <button onClick={refresh} className="ge-btn">● Refresh</button>
            </div>

            {/* History */}
            {hist.length > 0 && (
              <>
                <hr style={{ border: "none", borderTop: "1px solid #333", margin: "0.9rem 0" }} />
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <b>History</b>
                    <button className="ge-btn small" onClick={() => setHistExpanded(v => !v)}>
                      {histExpanded ? "Collapse history" : "Expand history"}
                    </button>
                  </div>
                  <ul style={{ marginTop: 6, fontSize: "0.9rem", opacity: 0.9 }}>
                    {shownHist.map((h, i) => (
                      <li key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>{new Date(h.t).toLocaleString(LOCALE)}</span>
                        <span style={{ textTransform: "capitalize" }}>{h.action}</span>
                        <span>{h.amount.toFixed(6)} ETH</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div
            style={{
              position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
              background: "rgba(255,255,255,0.06)", border: "1px solid #666", padding: "8px 12px",
              borderRadius: 8, zIndex: 1200,
            }}
          >
            {toast}
          </div>
        )}
      </main>

      <footer className="ge-page-footer">© {new Date().getFullYear()} GranEverest · {isOnBase ? "Base" : "Base Sepolia"}</footer>
    </>
  );
}
