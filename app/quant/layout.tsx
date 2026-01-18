"use client";
import React from "react";
import { ArrowLeft, Microscope, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation"; // Importamos esto para saber dónde estamos
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useLang } from "@/lib/useLang";

const customStyles = `
  .bg-grid-pattern {
    background-image: linear-gradient(to right, #222 1px, transparent 1px),
                      linear-gradient(to bottom, #222 1px, transparent 1px);
    background-size: 40px 40px;
  }
`;

export default function QuantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { lang } = useLang();

  // Lógica de Navegación Inteligente
  const isMainHub = pathname === "/quant";
  
  const navText = {
    en: { 
        backHome: "RETURN TO TERMINAL", 
        backHub: "RETURN TO QUANT HUB",
        badge: "QUANTITATIVE LAB", 
        live: "LIVE FEED" 
    },
    es: { 
        backHome: "VOLVER A TERMINAL", 
        backHub: "VOLVER AL HUB",
        badge: "LAB CUANTITATIVO", 
        live: "FEED EN VIVO" 
    }
  };
  const t = navText[lang as keyof typeof navText] || navText.en;

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans selection:bg-blue-500/30 pb-20 relative">
      <style jsx global>{customStyles}</style>
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20 bg-grid-pattern"></div>

      {/* NAVBAR SUPERIOR */}
      <nav className="fixed w-full top-0 z-[100] border-b border-white/10 bg-[#050505]">
        <div className="max-w-[1920px] mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* BOTÓN DE RETORNO INTELIGENTE */}
          <Link 
            href={isMainHub ? "/" : "/quant"} 
            className="flex items-center gap-2 text-gray-500 hover:text-white transition uppercase font-mono text-xs tracking-widest group"
          >
            {isMainHub ? <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform"/> : <LayoutGrid size={14} />} 
            {isMainHub ? t.backHome : t.backHub}
          </Link>

          <div className="flex items-center gap-4">
             <div className="hidden md:flex text-[10px] font-mono font-bold text-blue-500 items-center gap-2 px-3 py-1 border border-blue-500/30 rounded-sm bg-blue-500/5">
                <Microscope size={12}/> {t.badge}
             </div>
             <div className="text-[10px] font-mono text-emerald-500 flex items-center gap-2 px-3 py-1 border border-emerald-500/30 rounded-sm bg-emerald-500/5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> {t.live}
             </div>
             <div className="scale-90">
                <ConnectButton showBalance={false} chainStatus="icon" accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }} />
             </div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1800px] mx-auto px-6 pt-24 relative z-10">
        
        {/* HEADER PRINCIPAL */}
        {/* Solo mostramos el título grande si estamos en la raíz del Hub, 
            si estamos dentro de BTC/ETH, cada página tiene su propio título */}
        {isMainHub && (
            <div className="mb-8 border-b border-white/10 pb-8">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-white uppercase mb-4">
                    QUANTITATIVE <span className="text-blue-500">ANALYSIS HUB</span>
                </h1>
            </div>
        )}

        {/* AQUÍ SE RENDERIZAN LAS PÁGINAS HIJAS */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
        </div>

      </div>
    </div>
  );
}