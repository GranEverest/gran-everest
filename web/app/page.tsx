// web/app/page.tsx
"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useThemeBoot } from "@/hooks/useThemeBoot";

// ===== Reusable Launch button with delay =====
function LaunchButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  function handleClick() {
    if (pending) return;
    setPending(true);
    setTimeout(() => {
      router.push("/borrow");
      setPending(false);
    }, 1000); // 1s delay
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

// ===== Email capture block =====
function EmailCapture() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;

    const trimmed = email.trim();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!isValid) {
      setStatus("error");
      return;
    }

    setPending(true);
    setStatus("idle");

    try {
      const res = await fetch("/subscribe.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmed,
          source: "landing",
        }),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      const data = await res.json().catch(() => null);
      if (!data || !data.ok) {
        throw new Error("Bad response");
      }

      setStatus("ok");
      setEmail("");
    } catch (err) {
      console.error("Email subscribe error:", err);
      setStatus("error");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="email-block">
      <h2>Get updates by email</h2>
      <p className="small">
        Leave your email to hear about launches, security updates and new vaults
        on Base.
      </p>
      <form onSubmit={handleSubmit} className="email-form">
        <input
          type="email"
          className="email-input"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" className="pill email-btn" disabled={pending}>
          {pending ? "Saving…" : "Notify me"}
        </button>
      </form>
      {status === "ok" && (
        <p className="email-status email-status-ok">
          Got it. We&apos;ll reach out by email when there&apos;s news.
        </p>
      )}
      {status === "error" && (
        <p className="email-status email-status-error">
          Please enter a valid email address.
        </p>
      )}
    </section>
  );
}

// ===== Component =====
export default function Home() {
  const { dark, toggleTheme } = useThemeBoot();

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
          <Link href="/docs" className="pill">
            Docs
          </Link>
          <LaunchButton />
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
      <main className="wrap">
        {/* Mountain image */}
        <section className="hero-mountain-wrap" aria-hidden="true">
          <img
            src="/assets/mountain-hero.png?v=2"
            alt="GranEverest mountain"
            className="hero-mountain-img"
          />
        </section>

        <h1 className="center">ETH credit line on Base. No liquidations.</h1>
        <p className="center small" style={{ maxWidth: 780, margin: "0 auto" }}>
          GranEverest runs a single public ETH vault on Base mainnet. Deposit
          ETH as collateral, borrow ETH at <b>0% interest</b> and repay when you
          choose. No price oracle, no liquidation engine, and a single{" "}
          <b>0.25%</b> protocol fee on deposit and withdrawal.
        </p>
        <p className="center small credit-line-tag">
          One vault. Clear rules. Designed to be easy to reason about.
        </p>

        <p className="center" style={{ marginTop: 12 }}>
          <LaunchButton />
          <a href="#features" className="pill" style={{ marginLeft: 8 }}>
            Learn more
          </a>
        </p>

        {/* Features */}
        <section id="features" className="features">
          <article className="feature">
            <h3>0% interest in ETH</h3>
            <p className="small">
              Debt is denominated in ETH. There is no protocol interest rate:
              you repay exactly what you borrowed, plus gas. Borrow and repay
              have no protocol fee.
            </p>
          </article>
          <article className="feature">
            <h3>No liquidation engine</h3>
            <p className="small">
              The vault has no liquidation bots or auctions. A{" "}
              <b>70% loan-to-value</b> limit is enforced on-chain. If LTV would
              exceed 70%, new borrows or withdrawals simply revert.
            </p>
          </article>
          <article className="feature">
            <h3>On-chain, transparent costs</h3>
            <p className="small">
              Collateral lives directly in the vault on Base. A single{" "}
              <b>0.25% fee</b> applies on deposit and withdrawal only. All
              transactions are visible on BaseScan, and canonical addresses are
              listed on the <Link href="/trust">Trust</Link> page.
            </p>
          </article>
        </section>

        {/* How it works */}
        <section id="how" style={{ marginTop: 34 }}>
          <h2>How it works</h2>
          <ol className="small">
            <li>
              <b>Connect on Base.</b> Open <b>graneverest.com</b>, connect your
              wallet and switch to Base if needed. Interactions on other
              networks are blocked.
            </li>
            <li>
              <b>Deposit ETH as collateral.</b> Deposits are held on-chain in
              the vault and define your borrow limit (up to 70% LTV). A 0.25%
              protocol fee applies on each deposit.
            </li>
            <li>
              <b>Borrow at 0% interest.</b> Choose how much ETH to borrow within
              your limit. The interface helps you stay within conservative
              ranges and shows your projected position.
            </li>
            <li>
              <b>Receive ETH directly.</b> Borrowed ETH is fully non-custodial
              and can be moved or used elsewhere on Base. When you are ready to
              exit, repay and withdraw collateral at any time, subject to the
              same 70% LTV bound and a 0.25% withdrawal fee.
            </li>
          </ol>
        </section>

        {/* FAQ */}
        <section id="faq" style={{ marginTop: 28 }}>
          <h2>FAQ</h2>

          <details className="feature" style={{ marginTop: 10 }}>
            <summary>Where do funds live?</summary>
            <p className="small">
              Deposited ETH is held directly in the GranEverest vault contract
              on Base mainnet. You interact with the same contracts that are
              listed on the <Link href="/trust">Trust &amp; security</Link>{" "}
              page. The app is a convenience layer on top of those contracts.
            </p>
          </details>

          <details className="feature" style={{ marginTop: 10 }}>
            <summary>What fees apply?</summary>
            <p className="small">
              The protocol charges a <b>0.25% fee</b> on deposit and withdrawal
              only. Borrow and repay have no protocol fee. As with any on-chain
              system, users also pay their own gas costs on Base for each
              transaction.
            </p>
          </details>

          <details className="feature" style={{ marginTop: 10 }}>
            <summary>Can the protocol liquidate my position?</summary>
            <p className="small">
              The vault has no liquidation engine and does not perform
              price-based liquidations. Instead, it enforces a 70% LTV cap on
              new borrows and withdrawals. You remain responsible for managing
              your own risk in ETH terms.
            </p>
          </details>

          <details className="feature" style={{ marginTop: 10 }}>
            <summary>What are the main risks?</summary>
            <p className="small">
              As with any smart contract on an L2, there is{" "}
              <b>technical risk</b> (bugs, vulnerabilities),{" "}
              <b>operational risk</b> (pause controls, key management) and{" "}
              <b>network risk</b> (Base or Ethereum issues). The{" "}
              <Link href="/trust">Trust &amp; security</Link> page and{" "}
              <Link href="/docs">Docs</Link> describe these areas and how the
              system is tested. Users should size positions conservatively and
              never deposit funds they cannot afford to lose.
            </p>
          </details>

          <p className="center" style={{ marginTop: 18 }}>
            <LaunchButton />
          </p>
        </section>

        {/* Email capture (newsletter-like) */}
        <EmailCapture />

        {/* Contact & docs */}
        <section className="contact-block">
          <h2>Contact &amp; docs</h2>
          <p className="small">
            Questions, issues or security findings? Email us at{" "}
            <a
              href="mailto:contact@graneverest.com"
              className="contact-link"
            >
              contact@graneverest.com
            </a>
            .
          </p>
          <p className="small contact-links">
            <Link href="/docs">Docs</Link>
            <span>·</span>
            <Link href="/trust">Trust &amp; security</Link>
            <span>·</span>
            <a
              href="/assets/everest-vault-test-report-2025-11-23.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              Test &amp; analysis report (PDF)
            </a>
            <span>·</span>
            <a
              href="https://github.com/GranEverest/gran-everest"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </p>
        </section>
      </main>

      {/* Global styles for landing */}
      <style jsx global>{`
        :root {
          /* LIGHT theme defaults */
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
          white-space: nowrap;
        }

        .center {
          text-align: center;
        }

        .hero-mountain-wrap {
          margin: 32px auto 16px;
          text-align: center;
        }

        .hero-mountain-img {
          max-width: 520px;
          width: 100%;
          height: auto;
          display: inline-block;
          transform: translateX(18px);
        }

        @media (max-width: 600px) {
          .hero-mountain-img {
            transform: translateX(10px);
          }
        }

        .credit-line-tag {
          margin-top: 6px;
          margin-bottom: 4px;
        }

        .features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 22px;
          margin-top: 26px;
        }

        .feature {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px;
        }

        .small {
          color: var(--muted);
          font-size: 13px;
        }

        .email-block {
          margin-top: 36px;
          padding-top: 18px;
          border-top: 1px solid var(--border);
          text-align: center;
        }

        .email-block h2 {
          font-size: 15px;
          margin-bottom: 4px;
        }

        .email-form {
          margin-top: 10px;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
        }

        .email-input {
          min-width: 0;
          width: 230px;
          padding: 7px 10px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--bg);
          color: var(--text);
          font-size: 13px;
          outline: none;
        }

        .email-input::placeholder {
          color: var(--muted);
        }

        .email-btn {
          padding-inline: 14px;
          font-size: 13px;
        }

        .email-status {
          margin-top: 8px;
          font-size: 12px;
        }

        .email-status-ok {
          color: var(--muted);
        }

        .email-status-error {
          color: #b00020;
        }

        .contact-block {
          margin-top: 32px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }

        .contact-block h2 {
          font-size: 15px;
          margin-bottom: 4px;
        }

        .contact-link,
        .contact-links a {
          color: var(--text);
          text-decoration: underline;
          text-underline-offset: 2px;
          font-size: 12px;
        }

        .contact-links {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
          margin-top: 8px;
        }

        .contact-links span {
          color: var(--muted);
          font-size: 12px;
        }

        @media (max-width: 900px) {
          .features {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
