// web/app/docs/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ===== Theme boot (same behaviour as landing/trust) =====
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

// ===== Reusable Launch button with delay (same pattern) =====
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
export default function DocsPage() {
  const { dark, setDark } = useThemeBoot();

  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <Link className="brand" href="/">
          GranEverest
        </Link>
        <div className="nav-right">
          <Link href="/trust" className="pill">
            Trust
          </Link>
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
      <main className="docs-wrap">
        <p className="docs-kicker">GranEverest · ETH Vault on Base</p>
        <h1 className="docs-h1">Documentation</h1>
        <p className="docs-lead">
          This page explains how the GranEverest ETH vault works, how to use it
          safely as an end user, and how to integrate it programmatically as a
          developer. The focus is on simplicity, clear risk boundaries and
          transparent behaviour.
        </p>

        {/* 1. Overview */}
        <section className="docs-section">
          <h2 className="docs-h2">1. Overview</h2>
          <p className="docs-text">
            GranEverest is a single-asset ETH borrowing vault on Base (Ethereum
            L2). Users deposit ETH as collateral and can borrow ETH at 0%
            interest, up to a fixed loan-to-value (LTV) cap enforced on-chain.
          </p>
          <p className="docs-text">
            The design goal is to offer an ETH credit line that cannot
            liquidate users via price oracles or liquidation bots. Instead of a
            complex multi-asset money market, GranEverest keeps a narrow,
            observable surface:
          </p>
          <ul className="docs-list">
            <li>One ETH-only vault.</li>
            <li>No price oracle, no liquidation engine.</li>
            <li>Hard-coded LTV limit enforced in the contract.</li>
            <li>
              A single protocol fee of <b>0.25%</b> on deposit and withdrawal
              only.
            </li>
          </ul>
          <p className="docs-note">
            For live on-chain addresses, roles and test reports, see the{" "}
            <Link href="/trust">Trust page</Link>.
          </p>
        </section>

        {/* 2. Core properties */}
        <section className="docs-section">
          <h2 className="docs-h2">2. Core properties</h2>
          <div className="docs-grid">
            <div className="docs-card">
              <h3 className="docs-h3">Asset model</h3>
              <ul className="docs-list">
                <li>Collateral: ETH on Base.</li>
                <li>Debt unit: ETH.</li>
                <li>Borrowed ETH is freely transferable.</li>
              </ul>
            </div>
            <div className="docs-card">
              <h3 className="docs-h3">LTV &amp; limits</h3>
              <ul className="docs-list">
                <li>Maximum LTV: 70% (enforced on-chain).</li>
                <li>
                  Users cannot borrow above 70% of their collateral, and
                  withdrawals are blocked if they would push LTV above 70%.
                </li>
              </ul>
            </div>
            <div className="docs-card">
              <h3 className="docs-h3">Fees</h3>
              <ul className="docs-list">
                <li>
                  Protocol fee: <b>0.25%</b> on <b>deposit</b> and{" "}
                  <b>withdrawal</b> only.
                </li>
                <li>No protocol fee on borrow or repay.</li>
                <li>Users always pay L1/L2 gas costs for their own txs.</li>
              </ul>
            </div>
            <div className="docs-card">
              <h3 className="docs-h3">Liquidations</h3>
              <ul className="docs-list">
                <li>No liquidation engine in the contract.</li>
                <li>No price oracle, no keeper bots, no auctions.</li>
                <li>
                  Users remain in control of when to repay and withdraw, within
                  the 70% LTV boundary.
                </li>
              </ul>
            </div>
            <div className="docs-card">
              <h3 className="docs-h3">Pause behaviour</h3>
              <ul className="docs-list">
                <li>Owner/guardian can pause the vault.</li>
                <li>
                  When paused: <b>deposit</b>, <b>borrow</b> and{" "}
                  <b>withdraw</b> are blocked.
                </li>
                <li>
                  <b>repay</b> remains allowed while paused, so users can still
                  reduce or close their debt.
                </li>
              </ul>
            </div>
            <div className="docs-card">
              <h3 className="docs-h3">Anti-loop guard</h3>
              <ul className="docs-list">
                <li>
                  Same-block <b>borrow + deposit</b> loops are blocked at the
                  contract level.
                </li>
                <li>
                  This prevents “looping” borrowed ETH back into the vault in a
                  single atomic transaction to fake collateral growth.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. User guide */}
        <section className="docs-section">
          <h2 className="docs-h2">3. User guide</h2>

          <h3 className="docs-h3">3.1 Requirements</h3>
          <ul className="docs-list">
            <li>
              Wallet that supports Base (e.g. MetaMask, Rabby, Coinbase Wallet).
            </li>
            <li>ETH on Base for collateral.</li>
            <li>Additional ETH for gas fees.</li>
          </ul>

          <h3 className="docs-h3">3.2 Connect &amp; network</h3>
          <p className="docs-text">
            Open <Link href="/">graneverest.com</Link>, connect your wallet and
            switch to Base when prompted. The app will not allow interactions on
            non-Base networks.
          </p>

          <h3 className="docs-h3">3.3 Deposit ETH</h3>
          <ol className="docs-list">
            <li>Go to the “Loans / ETH Vault” page.</li>
            <li>Enter the amount of ETH you want to deposit as collateral.</li>
            <li>Review the protocol fee (0.25% on the deposit).</li>
            <li>Confirm the transaction in your wallet.</li>
          </ol>
          <p className="docs-text">
            Once confirmed, your collateral is recorded on-chain and your borrow
            limit is updated. The UI shows your collateral, debt and available
            borrow power in both ETH and USD terms (using an off-chain price
            feed for display only).
          </p>

          <h3 className="docs-h3">3.4 Borrow ETH</h3>
          <ol className="docs-list">
            <li>Adjust the “Borrow target” slider or input field.</li>
            <li>
              Make sure the requested amount stays within the 70% LTV limit.
              The UI will prevent obviously unsafe targets.
            </li>
            <li>Click “Borrow” and confirm the transaction.</li>
          </ol>
          <p className="docs-text">
            Your debt is denominated in ETH. There is no interest rate; the
            amount you owe does not grow over time due to protocol interest.
          </p>

          <h3 className="docs-h3">3.5 Repay ETH</h3>
          <ol className="docs-list">
            <li>Use the “Repay” section to send ETH back to the vault.</li>
            <li>You can repay partially or in full at any time.</li>
            <li>
              Overpayments are handled by repaying your full debt and refunding
              the excess ETH back to your wallet.
            </li>
          </ol>

          <h3 className="docs-h3">3.6 Withdraw collateral</h3>
          <ol className="docs-list">
            <li>
              Use the “Withdraw” section to request part or all of your
              collateral.
            </li>
            <li>
              If there is outstanding debt, the app will show how much you need
              to repay first in order to keep LTV ≤ 70%.
            </li>
            <li>
              Confirm the withdrawal and pay attention to the 0.25% protocol fee
              on the withdrawn amount.
            </li>
          </ol>
          <p className="docs-text">
            A “Withdraw all” helper can fully repay your debt and withdraw all
            remaining collateral in a simplified flow, when supported by the
            UI.
          </p>
        </section>

        {/* 4. Risks & limitations */}
        <section className="docs-section">
          <h2 className="docs-h2">4. Risks &amp; limitations</h2>
          <p className="docs-text">
            Using any smart contract on-chain involves risk. The following list
            is not exhaustive, but highlights key areas users should understand
            before using the vault:
          </p>
          <div className="docs-grid">
            <div className="docs-card">
              <h3 className="docs-h3">Smart contract risk</h3>
              <p className="docs-text">
                Bugs or vulnerabilities in the EverestVault contract or its
                dependencies could lead to loss of funds. The contract has been
                tested with unit tests, fuzz tests and static analysis, but it
                has limited real-world history.
              </p>
            </div>
            <div className="docs-card">
              <h3 className="docs-h3">Guardian / owner risk</h3>
              <p className="docs-text">
                The owner/guardian can pause the vault. While paused, deposits,
                borrows and withdrawals are blocked (repay remains allowed).
                Operational mistakes, compromised keys or malicious actions
                could impact the system.
              </p>
            </div>
            <div className="docs-card">
              <h3 className="docs-h3">L2 / Base risk</h3>
              <p className="docs-text">
                The vault runs on Base. Outages, sequencer issues or censorship
                at the L2 or L1 level could temporarily block interactions or
                affect withdrawals.
              </p>
            </div>
            <div className="docs-card">
              <h3 className="docs-h3">No price-based liquidations</h3>
              <p className="docs-text">
                The protocol does not liquidate you based on ETH price. This is
                a design feature, but it also means you are responsible for
                managing your own risk; if ETH prices move violently, your
                collateral value may change while your debt stays fixed in ETH.
              </p>
            </div>
            <div className="docs-card">
              <h3 className="docs-h3">App vs. contract</h3>
              <p className="docs-text">
                If the GranEverest UI is offline or unavailable, advanced users
                can still interact directly with the contract via BaseScan or
                custom scripts. However, this requires technical knowledge and
                carries its own risks.
              </p>
            </div>
            <div className="docs-card">
              <h3 className="docs-h3">Experimental nature</h3>
              <p className="docs-text">
                Compared to large, battle-tested money markets, GranEverest is a
                focused, early-stage system with a smaller surface but also less
                historical usage and review.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Contract & integration details */}
        <section className="docs-section">
          <h2 className="docs-h2">5. Contract &amp; integration details</h2>
          <p className="docs-text">
            GranEverest is implemented as a single main vault contract on Base
            mainnet. For the latest production address, roles and on-chain
            metadata, always refer to the{" "}
            <Link href="/trust">Trust page</Link> and the official GranEverest
            GitHub repository.
          </p>

          <div className="docs-grid docs-grid-2">
            <div className="docs-card">
              <h3 className="docs-h3">5.1 Network</h3>
              <ul className="docs-list">
                <li>Network: Base mainnet (L2 on Ethereum).</li>
                <li>Base chain ID: 8453.</li>
                <li>Native asset: ETH on Base.</li>
              </ul>
            </div>
            <div className="docs-card">
              <h3 className="docs-h3">5.2 Core functions</h3>
              <ul className="docs-list">
                <li>
                  <code>deposit()</code> — payable; adds ETH collateral and
                  applies the 0.25% fee.
                </li>
                <li>
                  <code>borrow(uint256 amount)</code> — borrows ETH if within
                  LTV limit.
                </li>
                <li>
                  <code>repay()</code> — payable; repays debt, refunds excess.
                </li>
                <li>
                  <code>withdraw(uint256 amount)</code> — withdraws collateral,
                  enforcing LTV and applying withdrawal fee.
                </li>
                <li>
                  <code>getUserData(address user)</code> — view helper returning
                  user collateral, debt and internal accounting values.
                </li>
              </ul>
            </div>
          </div>

          <h3 className="docs-h3">5.3 Example: read user data (viem)</h3>
          <pre className="docs-code">
            <code>{`import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import EverestVault from "../src/abi/EverestVault.json";

const VAULT_ADDRESS = "0x..."; // see /trust for the latest address

const client = createPublicClient({
  chain: base,
  transport: http("https://mainnet.base.org"),
});

async function getUserData(user: \`0x\${string}\`) {
  const result = await client.readContract({
    address: VAULT_ADDRESS,
    abi: EverestVault.abi ?? EverestVault,
    functionName: "getUserData",
    args: [user],
  });

  console.log("User data", result);
}`}</code>
          </pre>

          <h3 className="docs-h3">5.4 Example: borrow via script (viem)</h3>
          <pre className="docs-code">
            <code>{`import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import EverestVault from "../src/abi/EverestVault.json";

const VAULT_ADDRESS = "0x..."; // see /trust for the latest address

const account = privateKeyToAccount("0xYOUR_PRIVATE_KEY"); // do not hardcode in production

const client = createWalletClient({
  account,
  chain: base,
  transport: http("https://mainnet.base.org"),
});

async function borrow(amountWei: bigint) {
  const hash = await client.writeContract({
    address: VAULT_ADDRESS,
    abi: EverestVault.abi ?? EverestVault,
    functionName: "borrow",
    args: [amountWei],
  });

  console.log("Borrow tx hash:", hash);
}`}</code>
          </pre>
          <p className="docs-note">
            The examples above are for illustration. In production you should
            never hardcode private keys in source code and should handle gas
            configuration, error handling and retries carefully.
          </p>
        </section>

        {/* 6. Security, testing & monitoring */}
        <section className="docs-section">
          <h2 className="docs-h2">6. Security, testing &amp; monitoring</h2>
          <p className="docs-text">
            The GranEverest vault codebase is developed with a narrow scope and
            several testing layers:
          </p>
          <ul className="docs-list">
            <li>Hardhat unit tests covering core flows and edge cases.</li>
            <li>
              Foundry fuzz tests to validate LTV invariants, ETH conservation
              and debt behaviour under randomized sequences.
            </li>
            <li>
              Slither static analysis, with no high-severity issues reported in
              the current configuration.
            </li>
            <li>
              Manual functional testing on Base testnet and Base mainnet with
              limited-size positions.
            </li>
          </ul>
          <p className="docs-text">
            A detailed test and analysis report is available in PDF form on the{" "}
            <Link href="/trust">Trust page</Link> and the main landing page.
          </p>
          <p className="docs-text">
            Despite these measures, smart contract risk can never be fully
            eliminated. Users should size their positions accordingly and avoid
            depositing funds they cannot afford to lose.
          </p>
        </section>

        {/* 7. Responsible disclosure & contact */}
        <section className="docs-section">
          <h2 className="docs-h2">7. Responsible disclosure &amp; contact</h2>
          <p className="docs-text">
            Security researchers and integrators are encouraged to review the
            contracts and the public GitHub repository. For potential
            vulnerabilities, please follow a responsible disclosure process:
          </p>
          <ul className="docs-list">
            <li>
              Contact the team privately at{" "}
              <a
                href="mailto:contact@graneverest.com"
                className="docs-link-inline"
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
          </ul>
          <p className="docs-text">
            Bug bounty terms and dedicated bounty addresses will be published
            progressively as the protocol matures and usage grows. Until then,
            disclosures are handled on a best-effort basis.
          </p>
        </section>
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
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI,
            Roboto, Helvetica, Arial, sans-serif;
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

        .docs-wrap {
          max-width: 980px;
          margin: 0 auto;
          padding: 16px 20px 96px;
        }

        .docs-kicker {
          font-size: 11px;
          color: var(--muted);
          margin-bottom: 4px;
        }

        .docs-h1 {
          margin: 0;
          font-size: 24px;
        }

        .docs-lead {
          font-size: 13px;
          color: var(--muted);
          max-width: 760px;
          margin-top: 6px;
        }

        .docs-section {
          margin-top: 26px;
        }

        .docs-h2 {
          margin: 0 0 6px;
          font-size: 18px;
        }

        .docs-h3 {
          margin: 16px 0 6px;
          font-size: 14px;
        }

        .docs-text {
          font-size: 13px;
          color: var(--muted);
          margin: 0 0 8px;
        }

        .docs-note {
          font-size: 12px;
          color: var(--muted);
          margin-top: 8px;
        }

        .docs-list {
          margin: 0 0 8px 18px;
          padding: 0;
          font-size: 12.5px;
          color: var(--muted);
        }

        .docs-list li + li {
          margin-top: 2px;
        }

        .docs-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin-top: 12px;
        }

        .docs-grid-2 {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .docs-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px 16px;
        }

        .docs-code {
          margin-top: 10px;
          padding: 12px 14px;
          background: var(--card);
          color: var(--text);
          border-radius: 8px;
          border: 1px solid var(--border);
          font-size: 11px;
          overflow-x: auto;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
        }

        .docs-link-inline {
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        @media (max-width: 900px) {
          .docs-grid,
          .docs-grid-2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
