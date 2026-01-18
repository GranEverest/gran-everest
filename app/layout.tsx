import type { Metadata } from "next";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css"; 
import MacroBar from "./components/MacroBar";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Gran Everest Capital | DeFi Terminal",
  description: "Advanced institutional DeFi intelligence terminal.",
  // ESTO ARREGLA EL ERROR DE DARK READER
  other: {
    "darkreader-lock": "true", // Le dice a la extensión que no inyecte código aquí
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      {/* suppressHydrationWarning ayuda con otras extensiones */}
      <body className="bg-[#050505] text-white antialiased" suppressHydrationWarning={true}>
        <Providers>
          <MacroBar />
          {children}
        </Providers>
      </body>
    </html>
  );
}