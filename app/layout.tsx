import type { Metadata } from "next";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css"; 
import MacroBar from "./components/MacroBar";
import { Providers } from "./providers";

export const metadata: Metadata = {
  // --- SEO PRINCIPAL ---
  title: "Gran Everest - DeFi Intelligence Terminal",
  description: "Advanced analytics and yield strategies for Ethereum and Base networks.",
  keywords: ["DeFi", "Yield Farming", "Ethereum", "Base", "Crypto Analytics", "Gran Everest Capital"],
  
  // --- FAVICON (La Montaña) ---
  // Esto buscará el archivo 'icon.png' en tu carpeta 'app' o 'public'
  icons: {
    icon: '/icon.png', 
  },

  // --- CONFIGURACIÓN TÉCNICA ---
  other: {
    "darkreader-lock": "true", // Bloqueo de Dark Reader
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      {/* suppressHydrationWarning ayuda con extensiones del navegador */}
      <body className="bg-[#050505] text-white antialiased" suppressHydrationWarning={true}>
        <Providers>
          <MacroBar />
          {children}
        </Providers>
      </body>
    </html>
  );
}