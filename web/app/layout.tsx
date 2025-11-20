// web/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GranEverest — ETH Vault on Base",
  description: "Borrow at 0% interest in ETH on Base.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}

        {/* Marca de agua global al fondo */}
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
