// web/app/trust/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Reuse the same theme boot logic as home
function useThemeBoot() {
  const [dark, setDark] = useState(true);

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

const LAST_UPDATED = "2025-11-19";

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
          <Link href="/borrow" className="pill">
            Launch app
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

      {/* MAIN */}
      <main className="wrap">
        <header className="trust-header">
          <h1>Trust, risk &amp; transparency</h1>
          <p className="small">
            GranEverest Loans is an ETH vault deployed on Base. This page
            summarises the contract that is live, who controls what, and what
            risks you take by using it. This is not investment advice.
          </p>
        </header>

        <section className="trust-grid">
          {/* Contract in production */}
          <article className="trust-card">
            <h2>Contract in production</h2>
            <ul className="small">
              <li>Network: Base mainnet (Ethereum L2).</li>
              <li>
                Vault address:{" "}
                <code>0xA3F0e117F200763b7FA37250BFF63CBF690364B4</code>
              </li>
              <li>
                Contract type: <strong>EverestVault</strong> (single ETH vault
                with 0% interest).
              </li>
              <li>Status: deployed and active (not paused at the time of this writing).</li>
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
                <strong>Owner / Guardian:</strong> the operator&apos;s hardware
                wallet (Trezor).
              </li>
              <li>
                The owner can: <strong>pause</strong> and{" "}
                <strong>unpause</strong> the vault.
              </li>
              <li>
                The fee recipient address is controlled by the same owner
                (protocol treasury).
              </li>
              <li>
                Future goal: migrate these permissions to a multisig + time
                lock. Today it is a single key (key compromise risk).
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
                Anti-loop guard: a same-block rule prevents deposit-after-borrow
                loops that would otherwise enable leverage loops in one
                transaction.
              </li>
              <li>No liquidations: there is no liquidation engine.</li>
            </ul>
          </article>

          {/* Risks you take */}
          <article className="trust-card">
            <h2>Risks you take</h2>
            <ul className="small">
              <li>
                Smart contract risk: the contract has not been audited. Bugs can
                lead to partial or total loss of funds.
              </li>
              <li>
                Key / operator risk: the owner can pause or unpause the vault.
                If the key is compromised or used in bad faith, the protocol can
                be frozen or manipulated.
              </li>
              <li>
                L2 risk: Base is an Ethereum L2. You depend on Base security and
                its bridge. A failure in the L2 could affect funds.
              </li>
              <li>
                No guarantee of being &quot;safest&quot; or &quot;best
                yield&quot;. Capital use remains your own decision.
              </li>
              <li>
                Upgrade risk: if a new version of the vault is deployed, you
                would need to migrate manually (there is no auto-upgrade).
              </li>
            </ul>
          </article>

          {/* Operational commitments */}
          <article className="trust-card">
            <h2>Operational commitments</h2>
            <ul className="small">
              <li>
                The owner will use pause/unpause only to protect users in case
                of unexpected behaviour or incidents.
              </li>
              <li>
                Any change to parameters or contract versions will be
                communicated via official channels and reflected on this page.
              </li>
              <li>
                There is no hidden logic: the same contract you interact with is
                the one that executes your deposit, borrow, repay and withdraw.
              </li>
              <li>
                We do not guarantee profitability or returns; the protocol is an
                experimental product and you use it at your own risk.
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
        html[data-theme="light"] {
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
