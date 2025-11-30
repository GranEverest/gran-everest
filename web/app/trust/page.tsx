// web/app/trust/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useThemeBoot } from "@/hooks/useThemeBoot";

// === Canonical addresses on Base mainnet ===
const VAULT_ADDRESS =
  "0x0d1c77349E80F4c4AE47E318A3D0723D12159E2d"; // GranVaultBaseETH
const ROUTER_ADDRESS =
  "0xa5b19beBaEd75d52fe934B98A695Da79A3a7bDae"; // GranRouterBaseETH

const WETH_ADDRESS =
  "0x4200000000000000000000000000000000000006"; // Canonical WETH on Base
const USDC_ADDRESS =
  "0x833589fCD6EDb6E08f4c7c32D4f71b54bDa02913";
const USDT_ADDRESS =
  "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2";
const DAI_ADDRESS =
  "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb";

const ORACLE_ADDRESS =
  "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70"; // ETH/USD oracle

// Known controller / fee recipient (hardware wallet)
const OWNER_GUARDIAN_ADDRESS =
  "0xF5e97BAc061FA8572b55cD7969452f9492448Be1";

function short(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function TrustPage() {
  const { dark, toggleTheme } = useThemeBoot();
  const router = useRouter();
  const [launchPending, setLaunchPending] = useState(false);

  function handleLaunchClick() {
    if (launchPending) return;
    setLaunchPending(true);
    setTimeout(() => {
      router.push("/borrow");
      setLaunchPending(false);
    }, 1000);
  }

  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <Link className="brand" href="/">
          GranEverest
        </Link>
        <div className="nav-right">
          <Link href="/docs" className="pill">
            Docs
          </Link>
          <button
            type="button"
            className="pill"
            onClick={handleLaunchClick}
            disabled={launchPending}
          >
            {launchPending ? "Launching…" : "Launch app"}
          </button>
          <button
            id="themeToggle"
            className="pill"
            type="button"
            onClick={toggleTheme}
          >
            {dark ? "Light" : "Dark"}
          </button>
        </div>
      </nav>

      {/* MAIN */}
      <main className="wrap trust-wrap">
        <p className="small doc-tag">GranEverest · ETH vault on Base</p>
        <h1>Trust &amp; transparency</h1>
        <p className="small" style={{ maxWidth: 780 }}>
          This page consolidates the canonical on-chain references for the
          GranEverest ETH vault on Base, together with a high-level overview of
          the design, testing approach and security posture. The goal is to make
          it easy for users, integrators and reviewers to verify how the system
          is configured and how it behaves.
        </p>

        {/* 1. Canonical on-chain references */}
        <section className="doc-section">
          <h2>1. Canonical on-chain references</h2>
          <p className="small">
            All production contracts run on <b>Base mainnet</b> (chain ID{" "}
            <code>8453</code>). Addresses below are the single source of truth
            for the live deployment.
          </p>

          <div className="doc-grid">
            {/* Vault */}
            <article className="doc-card">
              <h3>GranVaultBaseETH (vault)</h3>
              <ul className="small">
                <li>
                  <b>Role:</b> main vault where users deposit ETH as collateral,
                  borrow at 0% interest and withdraw when repaid.
                </li>
                <li>
                  <b>Address:</b>{" "}
                  <a
                    href={`https://basescan.org/address/${VAULT_ADDRESS}`}
                    target="_blank"
                    rel="noreferrer"
                    className="address-link"
                  >
                    {short(VAULT_ADDRESS)}
                  </a>
                </li>
                <li>
                  <b>Debt &amp; collateral unit:</b> ETH/WETH.
                </li>
                <li>
                  <b>Max LTV:</b> 70% (enforced on-chain, no liquidation engine).
                </li>
                <li>
                  <b>Protocol fees:</b> 0.25% on <i>deposit</i> and{" "}
                  <i>withdraw</i> only; borrow and repay are fee-free
                  (gas-only).
                </li>
              </ul>
            </article>

            {/* Router */}
            <article className="doc-card">
              <h3>GranRouterBaseETH (router)</h3>
              <ul className="small">
                <li>
                  <b>Role:</b> orchestrates vault interactions where a user
                  borrows in ETH and optionally routes the output into another
                  supported asset in a single transaction, while respecting the
                  same 70% LTV and fee rules.
                </li>
                <li>
                  <b>Address:</b>{" "}
                  <a
                    href={`https://basescan.org/address/${ROUTER_ADDRESS}`}
                    target="_blank"
                    rel="noreferrer"
                    className="address-link"
                  >
                    {short(ROUTER_ADDRESS)}
                  </a>
                </li>
                <li>
                  Routes are constructed so that if execution cannot complete or
                  price protection is breached, the transaction reverts and the
                  user’s vault position remains unchanged (only gas is paid).
                </li>
              </ul>
            </article>

            {/* Core assets & oracle */}
            <article className="doc-card">
              <h3>Core assets &amp; oracle</h3>
              <ul className="small">
                <li>
                  <b>WETH (Base canonical):</b>{" "}
                  <a
                    href={`https://basescan.org/address/${WETH_ADDRESS}`}
                    target="_blank"
                    rel="noreferrer"
                    className="address-link"
                  >
                    {short(WETH_ADDRESS)}
                  </a>
                </li>
                <li>
                  <b>USDC:</b>{" "}
                  <a
                    href={`https://basescan.org/address/${USDC_ADDRESS}`}
                    target="_blank"
                    rel="noreferrer"
                    className="address-link"
                  >
                    {short(USDC_ADDRESS)}
                  </a>
                </li>
                <li>
                  <b>USDT:</b>{" "}
                  <a
                    href={`https://basescan.org/address/${USDT_ADDRESS}`}
                    target="_blank"
                    rel="noreferrer"
                    className="address-link"
                  >
                    {short(USDT_ADDRESS)}
                  </a>
                </li>
                <li>
                  <b>DAI:</b>{" "}
                  <a
                    href={`https://basescan.org/address/${DAI_ADDRESS}`}
                    target="_blank"
                    rel="noreferrer"
                    className="address-link"
                  >
                    {short(DAI_ADDRESS)}
                  </a>
                </li>
                <li>
                  <b>Price oracle:</b>{" "}
                  <a
                    href={`https://basescan.org/address/${ORACLE_ADDRESS}`}
                    target="_blank"
                    rel="noreferrer"
                    className="address-link"
                  >
                    {short(ORACLE_ADDRESS)}
                  </a>{" "}
                  (ETH / reference currency feed, used for internal risk
                  checks).
                </li>
              </ul>
            </article>

            {/* Roles & control */}
            <article className="doc-card">
              <h3>Roles &amp; control</h3>
              <ul className="small">
                <li>
                  <b>Owner / guardian:</b>{" "}
                  <a
                    href={`https://basescan.org/address/${OWNER_GUARDIAN_ADDRESS}`}
                    target="_blank"
                    rel="noreferrer"
                    className="address-link"
                  >
                    {short(OWNER_GUARDIAN_ADDRESS)}
                  </a>
                  , held on a hardware wallet.
                </li>
                <li>
                  <b>Capabilities:</b> pause/unpause the vault, adjust guarded
                  parameters where applicable, and receive protocol fees.
                  Ownership does <i>not</i> allow arbitrary withdrawal of user
                  funds; each user’s collateral and debt are tracked and
                  constrained by the contract.
                </li>
                <li>
                  <b>Pause behaviour:</b> while paused, <i>deposit</i>,{" "}
                  <i>borrow</i> and <i>withdraw</i> revert; <i>repay</i> remains
                  available so users can always reduce or close their debt.
                </li>
                <li>
                  On BaseScan, all roles and relevant parameters can be
                  independently verified via the contract{" "}
                  <i>Read / Write as Proxy</i> tabs.
                </li>
              </ul>
            </article>
          </div>
        </section>

        {/* 2. Design summary */}
        <section className="doc-section">
          <h2>2. Design summary</h2>
          <p className="small">
            GranEverest focuses on a narrow, explainable design: a single ETH
            vault with a fixed LTV ceiling and a clear fee model. The aim is to
            minimise hidden complexity while still allowing flexible use in
            practice.
          </p>
          <ul className="small">
            <li>
              <b>Single-asset vault:</b> users deposit ETH as collateral and
              borrow in ETH; no cross-asset liquidation engine, no funding
              rates, no variable interest.
            </li>
            <li>
              <b>0% protocol interest:</b> debt is denominated in ETH. The
              amount owed does not grow over time due to protocol-set interest
              (network gas still applies for each transaction).
            </li>
            <li>
              <b>On-chain LTV limit:</b> a hard 70% LTV is enforced by the
              vault. Withdrawals and new borrows that would exceed this limit
              revert.
            </li>
            <li>
              <b>Strict fee surface:</b> 0.25% protocol fee on deposit and
              withdrawal only. Borrow and repay flows do not carry protocol
              fees.
            </li>
            <li>
              <b>Router as an optional layer:</b> the router contract builds
              more complex flows (for example, borrowing and settling in
              another supported asset) but cannot bypass the vault’s LTV and fee
              rules.
            </li>
            <li>
              <b>No liquidation engine:</b> there are no liquidation bots or
              auctions. Users remain responsible for managing their own risk
              within the 70% LTV boundary.
            </li>
          </ul>
        </section>

        {/* 3. Security, testing & monitoring */}
        <section className="doc-section">
          <h2>3. Security, testing &amp; monitoring</h2>
          <p className="small">
            The current codebase is developed with a narrow scope and several
            layers of testing and review. These measures reduce risk but cannot
            eliminate it entirely; users should size positions accordingly and
            avoid depositing funds they cannot afford to lose.
          </p>

          <h3 className="doc-subtitle">3.1 Hardhat tests</h3>
          <ul className="small">
            <li>
              Core flows: <i>deposit</i>, <i>borrow</i>, <i>repay</i>,{" "}
              <i>withdraw</i>, including all fee paths.
            </li>
            <li>
              Anti-loop guard: same-block <i>borrow → deposit</i> loops are
              rejected at the protocol level.
            </li>
            <li>
              Edge cases around deposit/withdraw (0.25% fee) and over-repayment
              behaviour (excess ETH is returned to the user).
            </li>
            <li>
              Events and accounting checks across multiple users and sequences,
              ensuring collateral and debt accounting stay consistent.
            </li>
          </ul>

          <h3 className="doc-subtitle">3.2 Static analysis</h3>
          <ul className="small">
            <li>
              Static-analysis tooling (for example, Slither) is run regularly on
              the vault and supporting contracts.
            </li>
            <li>
              Focus on re-entrancy, incorrect access control, unchecked external
              calls and arithmetic issues.
            </li>
            <li>
              The current configuration reports no known high-severity issues in
              these runs.
            </li>
            <li>
              Reports and configuration files are kept in the public repository
              for independent review.
            </li>
          </ul>

          <h3 className="doc-subtitle">3.3 Fuzzing &amp; property tests</h3>
          <ul className="small">
            <li>
              Fuzz tests exercise random sequences of{" "}
              <i>deposit / borrow / repay / withdraw</i> actions from multiple
              users.
            </li>
            <li>
              Invariants include LTV ≤ 70%, non-negative balances, ETH/WETH
              conservation and correct handling of protocol fees.
            </li>
            <li>
              Additional tests target the pause behaviour and anti-loop guard,
              ensuring they cannot be bypassed by combined calls or unusual
              sequences.
            </li>
            <li>
              A consolidated test &amp; analysis report (PDF) is published on
              the main site and linked from this page for external reviewers.
            </li>
          </ul>

          <h3 className="doc-subtitle">3.4 Manual review &amp; live testing</h3>
          <ul className="small">
            <li>
              Manual code review of the Solidity contracts and deployment
              scripts, with particular focus on access control, numerical
              limits, and upgrade / migration paths.
            </li>
            <li>
              Scenario-based testing on Base testnet and Base mainnet with
              limited-size positions, validating the behaviour of deposits,
              borrows, repayments and withdrawals under realistic conditions.
            </li>
            <li>
              Continuous comparison of on-chain data (via BaseScan) with the app
              UI to ensure balances, fees and limits are displayed accurately.
            </li>
            <li>
              Monitoring of key metrics (TVL, active borrowers, pause status)
              using public explorers and internal dashboards.
            </li>
          </ul>

          <h3 className="doc-subtitle">3.5 Public review</h3>
          <ul className="small">
            <li>
              All core contracts are verified on BaseScan, so their source code
              can be inspected directly at the addresses listed above.
            </li>
            <li>
              The full source, deployment scripts and tests are available in the
              public GitHub repository, enabling independent review and
              reproducible deployments.
            </li>
            <li>
              No formal third-party audit has been completed yet. External
              reviews and audits will be commissioned as TVL and usage grow.
            </li>
          </ul>
        </section>

        {/* 4. Bug bounty & disclosure */}
        <section className="doc-section">
          <h2>4. Bug bounty &amp; disclosure</h2>
          <p className="small">
            Security researchers and integrators are encouraged to review the
            contracts and the public GitHub repository. For potential
            vulnerabilities, please follow a responsible disclosure process:
          </p>
          <ul className="small">
            <li>
              Contact the team privately at{" "}
              <a
                href="mailto:contact@graneverest.com"
                className="contact-link"
              >
                contact@graneverest.com
              </a>{" "}
              with a clear description of the issue.
            </li>
            <li>
              Avoid publishing full exploit details until there has been a
              reasonable chance to patch or mitigate.
            </li>
            <li>
              Where possible, include reproduction steps, impacted scenarios and
              an assessment of severity.
            </li>
            <li>
              Bug bounty terms and dedicated bounty addresses will be published
              progressively as the protocol matures and usage grows. Until then,
              disclosures are handled on a best-effort basis.
            </li>
          </ul>
        </section>

        {/* 5. Roadmap & next steps */}
        <section className="doc-section">
          <h2>5. Roadmap &amp; next steps</h2>
          <p className="small">
            The current focus is on keeping the ETH vault stable, transparent
            and safe to integrate. Over time, the platform is intended to grow
            in depth rather than just in surface area.
          </p>
          <ul className="small">
            <li>
              <b>Deeper security reviews:</b> external security review / audit
              as TVL and usage justify it, including additional formal methods
              and runtime monitoring.
            </li>
            <li>
              <b>Expanded vault set:</b> additional vaults built on the same
              principles—single-asset, explicit caps, clear LTV limits and no
              opaque liquidation engine.
            </li>
            <li>
              <b>On-chain yield options:</b> optional strategies where collateral
              can be directed to transparent, on-chain yield sources (for
              example, staking) while keeping risk surfaces as narrow and
              auditable as possible.
            </li>
            <li>
              <b>Isolated strategies and vaults:</b> exploration of
              multi-vault architectures where strategies are isolated, so that
              issues in one vault or strategy do not propagate to others. The
              objective is that failure domains remain small and predictable.
            </li>
            <li>
              <b>Operational hardening:</b> stronger monitoring, alerting and
              incident playbooks, together with clearer public dashboards for
              vault metrics and risk indicators.
            </li>
          </ul>
        </section>

        {/* 6. Contact */}
        <section className="doc-section">
          <h2>6. Contact</h2>
          <p className="small">
            For security reports, integration questions or general enquiries,
            please reach out at{" "}
            <a
              href="mailto:contact@graneverest.com"
              className="contact-link"
            >
              contact@graneverest.com
            </a>
            . Technical reviewers are encouraged to verify contract addresses on
            BaseScan and review the codebase on GitHub.
          </p>
        </section>
      </main>

      {/* Styles (aligned with borrow/docs) */}
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
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI,
            Roboto, Helvetica, Arial, sans-serif;
        }

        a {
          color: var(--link);
          text-decoration: none;
        }

        h1,
        h2,
        h3 {
          margin: 0.75rem 0;
        }

        .wrap {
          max-width: 980px;
          margin: 0 auto;
          padding: 16px 20px 96px;
        }

        .nav {
          position: sticky;
          top: 0;
          z-index: 10;
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
          white-space: nowrap;
        }

        .small {
          color: var(--muted);
          font-size: 13px;
        }

        .trust-wrap h1 {
          font-size: 22px;
          margin-top: 8px;
        }

        .doc-tag {
          margin-top: 8px;
          margin-bottom: 2px;
        }

        .doc-section {
          margin-top: 28px;
        }

        .doc-subtitle {
          margin-top: 18px;
          font-size: 15px;
        }

        .doc-grid {
          margin-top: 16px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .doc-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px;
        }

        .doc-card h3 {
          font-size: 14px;
          margin-bottom: 6px;
        }

        .address-link {
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .contact-link {
          color: var(--text);
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        @media (max-width: 900px) {
          .doc-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
