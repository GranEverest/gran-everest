// web/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GranEverest — ETH Vault on Base",
  description:
    "Borrow ETH at 0% interest on Base. Debt in ETH. 0.25% protocol fee on deposits and withdrawals only.",
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
