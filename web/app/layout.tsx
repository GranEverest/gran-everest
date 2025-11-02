// web/app/layout.tsx
import "./global.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GranEverest",
  description: "Borrow at 0% in ETH on Base",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
