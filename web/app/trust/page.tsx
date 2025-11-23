"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ===== Theme boot (same behaviour as landing) =====
function useThemeBoot() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("geTheme");
      const isDark = saved === "dark";
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

// ===== Reusable Launch button with delay (same as landing) =====
function LaunchButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  function handleClick() {
    if (pending) return;
    setPending(true);
    setTimeout(() => {
      router.push("/borrow");
      setPending(false);
    }, 800);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`pill ${className ?? ""}`}
      disabled={pending}
    >
      {pending ? "Launching…" : "Launch app"}
    </button>
  );
}

// ===== Page =====
export default function TrustPage() {
  const { dark, setDark } = useThemeBoot();

  return (
    <>
      {/* NAV (no Trust button here) */}
      <nav className="nav">
        <Link className="brand" href="/">
          GranEverest
        </Link>
        <div className="nav-right">
          <LaunchButton />
          <button
            id="themeToggle"
            className="pill"
            type="button"
            onClick={() => setDark((v) => !v)}
          >
            {dark ? "Light" : "Dark"}
          </button>
        </div>
      </nav>

      {/* MAIN */}
      <main className="trust-wrap">
        <p className="trust-kicker">GranEverest · ETH Vault</p>
        <h1 className="trust-h1">Trust</h1>
        <p className="trust-lead">
          Transparent contracts, capped risk, and a simple vault model. No
          liquidation risk. No hidden levers.
        </p>

        {/* On-chain setup */}
        <section className="trust-section">
          <h2 className="trust-h2">On-chain setup</h2>
          <p className="trust-lead">
            Everything important lives on Base. You can verify all addresses and
            interactions directly onchain.
          </p>

          <div className="trust-grid">
            <div className="trust-card">
              <h3 className="trust-h3">Production vault</h3>
              <p className="trust-muted">
                EverestVault — Base mainnet. The live ETH vault used by the
                GranEverest borrow app. Debt unit is ETH, collateral is ETH, and
                the protocol fee is <b>0.25%</b> on deposits and withdrawals
                only. Borrow and repay have no protocol fee (gas only).
              </p>

              <p className="trust-mono">
                Vault address:{" "}
                <a
                  href="https://basescan.org/address/0x60786Bc484bDC031475f2a096C47fA7435793CB5"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="trust-address-chip"
                >
                  0x60786Bc484bDC031475f2a096C47fA7435793CB5
                </a>
              </p>

              <ul className="trust-list">
                <li>LTV hard-cap: 70% of collateral value.</li>
                <li>No liquidation engine, no price oracle dependency.</li>
                <li>Anti-loop same-block guard on borrow/deposit.</li>
              </ul>
            </div>

            <div className="trust-card">
              <h3 className="trust-h3">Owner / guardian</h3>
              <p className="trust-muted">Base mainnet</p>
              <p className="trust-muted">
                The same address currently acts as owner, guardian and
                feeRecipient. Operationally, pausing/unpausing is done via
                BaseScan with a hardware wallet, never from scripts that live in
                this repo.
              </p>

              <p className="trust-mono">
                Guardian / treasury:{" "}
                <span className="trust-address-chip">
                  0xF5e97BAc061FA8572b55cD7969452F4942448Be1
                </span>
              </p>

              <ul className="trust-list">
                <li>Can pause/unpause the vault contract.</li>
                <li>
                  Receives the 0.25% protocol fee on deposit/withdraw.
                </li>
                <li>No upgradeable proxy, no hidden implementation.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Risk caps */}
        <section className="trust-section">
          <h2 className="trust-h2">Risk caps &amp; guarantees</h2>
          <div className="trust-grid">
            <div className="trust-card">
              <p className="trust-muted">
                We keep the product intentionally narrow: single-asset ETH
                vault, explicit LTV cap, and no liquidation logic.
              </p>
            </div>

            <div className="trust-card">
              <h3 className="trust-h3">No liquidation risk</h3>
              <p className="trust-muted">
                The vault does not implement liquidations or price oracles. Your
                position cannot be forcibly liquidated by the protocol. You can
                always repay and withdraw within the LTV constraints.
              </p>
            </div>

            <div className="trust-card">
              <h3 className="trust-h3">LTV ≤ 70%</h3>
              <p className="trust-muted">
                Borrowing is enforced onchain to 70% maximum LTV. Both unit
                tests and fuzz tests validate that the LTV never exceeds this
                threshold under any tested sequence.
              </p>
            </div>

            <div className="trust-card">
              <h3 className="trust-h3">Pause behaviour</h3>
              <p className="trust-muted">
                When paused, the vault blocks deposit, borrow and withdrawal,
                but <b>repay remains allowed</b>, so users can still reduce risk
                and close positions while the protocol is paused.
              </p>
            </div>
          </div>
        </section>

        {/* Testing & analysis */}
        <section className="trust-section">
          <h2 className="trust-h2">Testing &amp; analysis</h2>
          <div className="trust-grid trust-grid-3">
            <div className="trust-card">
              <h3 className="trust-h3">Hardhat tests</h3>
              <p className="trust-mono">npx hardhat test — 17/17 tests passing.</p>
              <ul className="trust-list">
                <li>Anti-loop: same-block borrow + deposit blocked.</li>
                <li>Fee accounting on deposit/withdraw (0.25%).</li>
                <li>Borrow, repay and withdraw edge cases.</li>
                <li>Pause/unpause and allowed actions while paused.</li>
              </ul>
            </div>

            <div className="trust-card">
              <h3 className="trust-h3">Slither static analysis</h3>
              <p className="trust-muted">
                slither . --compile-force-framework hardhat — latest run
                completed with only informational findings (mainly in
                OpenZeppelin libraries, test helpers and the intentional
                same-block guard / ETH send patterns). No high-severity issues
                were identified in the production vault logic.
              </p>
              <p className="trust-muted">
                This is not a replacement for a full manual audit, but it&apos;s
                an extra automated layer on top of tests and fuzzing.
              </p>
            </div>

            <div className="trust-card">
              <h3 className="trust-h3">Foundry fuzzing</h3>
              <p className="trust-mono">
                forge test -vv — 4 fuzz tests passing (256 runs each) on the ETH
                vault model:
              </p>
              <ul className="trust-list">
                <li>Debt never becomes negative.</li>
                <li>
                  ETH conservation across deposit/withdraw and
                  deposit/borrow/repay flows.
                </li>
                <li>LTV never exceeds 70% under fuzzed scenarios.</li>
              </ul>
              <p className="trust-muted" style={{ marginTop: 8 }}>
                Full details, commands and interpretations are documented in the
                latest report:
                <br />
                <a
                  href="/assets/everest-vault-test-report-2025-11-23.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="trust-download-link"
                >
                  Download EverestVault test &amp; analysis report (PDF)
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Bug bounty & roadmap */}
        <section className="trust-section">
          <h2 className="trust-h2">Bug bounty &amp; roadmap</h2>
          <div className="trust-grid">
            <div className="trust-card">
              <h3 className="trust-h3">Bug bounty</h3>
              <p className="trust-muted">
                A dedicated vault/balance is reserved for bug bounties on
                critical findings that affect user funds in the EverestVault on
                Base. The bounty terms will be published publicly and updated
                over time.
              </p>
              <p className="trust-muted">
                Until a formal program is live, responsible disclosure can be
                initiated via the official contact channels listed on the main
                site.
              </p>
            </div>

            <div className="trust-card">
              <h3 className="trust-h3">What&apos;s next</h3>
              <ul className="trust-list">
                <li>External security review / audit.</li>
                <li>Expanded documentation for integrators.</li>
                <li>Optional additional risk caps at the app layer.</li>
              </ul>
              <p className="trust-muted">
                The goal is to keep the protocol simple, observable and
                defensible: one ETH vault, no hidden complexity, and clear risk
                boundaries.
              </p>
            </div>
          </div>
        </section>

        {/* Last updated (bottom, above global footer) */}
        <p className="trust-updated">Last updated: 2025-11-23</p>
      </main>

      {/* Styles */}
      <style jsx global>{`
        :root {
          --bg: #ffffff;
          --text: #111;
          --muted: #666;
          --card: #fafafa;
          --border: #e5e5e5;
          --btn-bg: #ffffff;
          --btn-fg: #111;
          --brand: #111;
          --link: #111;
        }
        html[data-theme="dark"] {
          --bg: #0f0f0f;
          --text: #e7e7e7;
          --muted: #bdbdbd;
          --card: #111;
          --border: #222;
          --btn-bg: #ffffff;
          --btn-fg: #111;
          --brand: var(--text);
          --link: var(--text);
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: var(--bg);
          color: var(--text);
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto,
            Helvetica, Arial, sans-serif;
        }

        a {
          color: var(--link);
          text-decoration: none;
        }

        .nav {
          position: sticky;
          top: 0;
          z-index: 2;
          display: flex;
          gap: 10px;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
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
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--btn-bg);
          color: var(--btn-fg) !important;
          font-size: 14px;
          line-height: 1;
          cursor: pointer;
        }

        .trust-wrap {
          max-width: 980px;
          margin: 0 auto;
          padding: 16px 20px 96px;
        }

        .trust-kicker {
          font-size: 11px;
          color: var(--muted);
          margin-bottom: 4px;
        }

        .trust-h1 {
          margin: 0;
          font-size: 24px;
        }

        .trust-h2 {
          margin: 24px 0 6px;
          font-size: 18px;
        }

        .trust-h3 {
          margin: 0 0 6px;
          font-size: 14px;
        }

        .trust-lead {
          font-size: 13px;
          color: var(--muted);
          max-width: 720px;
        }

        .trust-section {
          margin-top: 26px;
        }

        .trust-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          margin-top: 14px;
        }

        .trust-grid-3 {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .trust-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px 16px;
        }

        .trust-muted {
          font-size: 12px;
          color: var(--muted);
          margin: 0 0 6px;
        }

        .trust-mono {
          margin: 6px 0 8px;
          font-size: 11px;
          color: var(--muted);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
        }

        .trust-list {
          margin: 0;
          padding-left: 18px;
          font-size: 12px;
          color: var(--muted);
        }

        .trust-list li + li {
          margin-top: 2px;
        }

        .trust-address-chip {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: var(--card);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
          font-size: 11px;
          color: var(--text);
          text-decoration: none;
        }

        .trust-address-chip:hover {
          background: var(--bg);
        }

        .trust-download-link {
          font-size: 12px;
          color: var(--text);
          text-decoration: underline;
        }

        .trust-download-link:hover {
          opacity: 0.85;
        }

        .trust-updated {
          margin-top: 26px;
          font-size: 11px;
          color: var(--muted);
        }

        @media (max-width: 900px) {
          .trust-grid,
          .trust-grid-3 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
