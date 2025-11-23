// web/app/trust/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LaunchAppButton } from "../components/LaunchAppButton";

// Reuse the same theme boot logic as home, default LIGHT
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

const LAST_UPDATED = "2025-11-22";

export default function TrustPage() {
  const { dark, setDark } = useThemeBoot();

  return (
    <>
      {/* NAVBAR */}
      <nav className="nav">
        <Link className="brand" href="/">
          GranEverest
        </Link>

        <div className="nav-right">
          <Link href="/trust" className="pill">
            Trust
          </Link>
          <LaunchAppButton className="pill">Launch app</LaunchAppButton>
          <button
            type="button"
            className="pill"
            onClick={() => setDark((v) => !v)}
          >
            {dark ? "Light" : "Dark"}
          </button>
        </div>
      </nav>

      {/* MAIN */}
      <main className="wrap">
        <header className="trust-header">
          <h1>Trust, risk &amp; transparency</h1>
          <p className="small">
            GranEverest Loans is an ETH vault deployed on Base. This page
            summarises the contract that is live, who controls what, and the
            main technical parameters. This is not investment advice.
          </p>
        </header>

        <section className="trust-grid">
          {/* Contract in production */}
          <article className="trust-card">
            <h2>Contract in production</h2>
            <ul className="small">
              <li>Network: Base mainnet (Ethereum L2).</li>
              <li>
                Vault contract:{" "}
                <code>0x8A83E4349f4bd053cef3083F4219628957f54725</code>
              </li>
              <li>
                Contract type: <strong>EverestVault</strong> (ETH-collateral
                vault, 0% interest, no liquidations).
              </li>
              <li>
                Status: deployed and active (not paused at the time of this
                writing).
              </li>
              <li>
                You can verify the contract and source code directly on the Base
                explorer by searching the vault address.
              </li>
            </ul>
          </article>

          {/* Roles & control */}
          <article className="trust-card">
            <h2>Roles &amp; control</h2>
            <ul className="small">
              <li>
                <strong>Owner:</strong> a Safe wallet on Base (1/1 signer,
                hardware-backed).
              </li>
              <li>
                The owner can: <strong>pause</strong> and{" "}
                <strong>unpause</strong> the vault contract.
              </li>
              <li>
                The same Safe controls fee parameters and any future contract
                migrations.
              </li>
              <li>
                Long-term goal: expand the Safe to a multi-sig setup with
                multiple hardware wallets and time-based controls.
              </li>
            </ul>
          </article>

          {/* Key parameters */}
          <article className="trust-card">
            <h2>Key parameters</h2>
            <ul className="small">
              <li>Collateral: ETH only.</li>
              <li>Debt unit: ETH.</li>
              <li>Max LTV: 70% (borrow limit = 0.7 × collateral).</li>
              <li>
                Protocol fee: <strong>0.25%</strong> on deposit and withdrawal
                only. Borrow and repay have no protocol fee (gas only).
              </li>
              <li>
                Anti-loop guard: the vault design prevents simple leverage loops
                from being used as “free extra cash”.
              </li>
              <li>No liquidations: there is no liquidation engine.</li>
            </ul>
          </article>

          {/* Operational commitments */}
          <article className="trust-card">
            <h2>Operational commitments</h2>
            <ul className="small">
              <li>
                The Safe owner uses pause/unpause only as a protective measure
                in case of unexpected behaviour or incidents.
              </li>
              <li>
                Any relevant change to parameters or contract versions will be
                communicated via official channels and reflected on this page.
              </li>
              <li>
                There is no hidden logic: the same contract you interact with is
                the one that executes your deposit, borrow, repay and withdraw.
              </li>
              <li>
                We do not guarantee profitability or returns; the protocol is an
                experimental product and you use it at your own discretion.
              </li>
            </ul>
          </article>
        </section>

        <p className="trust-meta small">
          Last updated: {LAST_UPDATED} ·{" "}
          <Link href="/" className="trust-link">
            Back to home
          </Link>
        </p>
      </main>

      {/* Styles specific for this page (reusing same tokens as home) */}
      <style jsx global>{`
        :root {
          /* LIGHT por defecto */
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
          font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI",
            Roboto, Helvetica, Arial, sans-serif;
        }

        a {
          color: var(--link);
          text-decoration: none;
        }

        .wrap {
          max-width: 960px;
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

        .trust-header h1 {
          margin-top: 8px;
          margin-bottom: 4px;
        }

        .trust-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 18px;
          margin-top: 24px;
        }

        .trust-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px 18px;
        }

        .small {
          color: var(--muted);
          font-size: 13px;
        }

        .trust-meta {
          margin-top: 20px;
          text-align: left;
        }

        .trust-link {
          text-decoration: underline;
        }
      `}</style>
    </>
  );
}
