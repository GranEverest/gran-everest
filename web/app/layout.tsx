// /web/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "GranEverest — Borrow at 0% Interest in ETH",
  description:
    "Borrow at 0% interest with ETH collateral on Base. Non-custodial, open architecture.",
  metadataBase: new URL("https://graneverest.com"),
  alternates: { canonical: "/" },
};

const ThemeScript = `
(function(){
  try{
    var s = localStorage.getItem('geTheme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = s ? (s === 'dark') : prefersDark;
    if(dark) document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }catch(e){}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const year = new Date().getFullYear();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicons / Manifest */}
        <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg" />
        <link rel="apple-touch-icon" href="/assets/icon-180.png" />
        <link rel="manifest" href="/assets/manifest.webmanifest" />
        <meta name="theme-color" content="#0f0f0f" />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content="#ffffff"
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: dark)"
          content="#0f0f0f"
        />
        {/* Evita el destello de tema */}
        <script dangerouslySetInnerHTML={{ __html: ThemeScript }} />
      </head>
      <body>
        <header
          style={{
            padding: "10px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div className="ge-logo">GranEverest</div>
          <nav style={{ display: "flex", gap: 8 }}>
            <Link className="ge-btn small" href="/borrow">
              Launch app
            </Link>
          </nav>
        </header>

        <main style={{ padding: "0 14px" }}>{children}</main>

        <footer className="ge-page-footer">© {year} GranEverest · Base</footer>
      </body>
    </html>
  );
}
