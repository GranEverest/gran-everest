// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";

import { Providers } from "./components/Providers";
import ConnectWalletButton from "./components/ConnectWalletButton";

export const metadata: Metadata = {
  title: "GranEverest • Autopilot (Base)",
  description: "MVP Autopilot en Base — Estrategia BOLD/USDC.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-black text-white antialiased">
        <Providers>
          <header className="w-full border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
            <div className="text-sm font-semibold tracking-wide">
              GranEverest • Autopilot (Base)
            </div>

            <nav className="flex items-center gap-3 text-xs">
              <a href="/" className="hover:underline">
                Home
              </a>
              <a href="/bold-usdc" className="hover:underline">
                BOLD/USDC
              </a>

              <ConnectWalletButton />
            </nav>
          </header>

          <main className="px-4 py-8 max-w-3xl mx-auto">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
