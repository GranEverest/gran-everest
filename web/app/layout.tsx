// web/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GranEverest — Borrow ETH with no liquidations. Ever.",
  description:
    "Borrow ETH with no liquidations. One ETH vault on Base. No oracle, no liquidation engine, no changing rates. A single 0.25% fee on deposit and withdrawal. An ETH credit line that can't liquidate you.",
  icons: {
    icon: [
      { url: "/assets/favicon.svg", type: "image/svg+xml" },
      { url: "/assets/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/assets/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      {
        url: "/assets/icon-180.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: "/assets/favicon-32.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Contenido de cada página */}
        <div style={{ flex: 1 }}>{children}</div>

        {/* Footer global siempre abajo */}
        <footer
          style={{
            textAlign: "center",
            padding: "24px 0 32px",
            fontSize: 12,
            opacity: 0.7,
          }}
        >
          © 2025 GranEverest · Base
        </footer>
      </body>
    </html>
  );
}
