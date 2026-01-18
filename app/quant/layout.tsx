"use client";
import React from "react";
import { ArrowLeft, Microscope, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const { lang } = useLang(); // Detectamos el idioma

  const isMainHub = pathname === "/quant";
  
  // DICCIONARIO DE TRADUCCIÓN
  const t = {
    en: { 
        backHome: "RETURN TO TERMINAL", 
        backHub: "RETURN TO QUANT HUB",
        badge: "QUANTITATIVE LAB", 
        live: "LIVE FEED",
        mainTitle: "ANALYSIS HUB",
        quant: "QUANTITATIVE"
    },
    es: { 
        backHome: "VOLVER A TERMINAL", 
        backHub: "VOLVER AL HUB",
        badge: "LAB CUANTITATIVO", 
        live: "FEED EN VIVO",
        mainTitle: "CENTRO DE ANÁLISIS",
        quant: "CUANTITATIVO"
    }
  };
  
  // Seleccionamos el texto según el idioma actual
  const text = t[lang as keyof typeof t] || t.en;

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans selection:bg-blue-500/30 pb-20 relative">
      <style jsx global>{customStyles}</style>
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20 bg-grid-pattern"></div>

      {/* NAVBAR */}
      <nav className="fixed w-full top-0 z-[100] border-b border-white/10 bg-[#050505]">
        <div className="max-w-[1920px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link 
            href={isMainHub ? "/" : "/quant"} 
            className="flex items-center gap-2 text-gray-500 hover:text-white transition uppercase font-mono text-xs tracking-widest group"
          >
            {isMainHub ? <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform"/> : <LayoutGrid size={14} />} 
            {isMainHub ? text.backHome : text.backHub}
          </Link>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex text-[10px] font-mono font-bold text-blue-500 items-center gap-2 px-3 py-1 border border-blue-500/30 rounded-sm bg-blue-500/5">
                <Microscope size={12}/> {text.badge}
             </div>
             <div className="text-[10px] font-mono text-emerald-500 flex items-center gap-2 px-3 py-1 border border-emerald-500/30 rounded-sm bg-emerald-500/5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> {text.live}
             </div>
             <div className="scale-90">
                <ConnectButton showBalance={false} chainStatus="icon" accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }} />
             </div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1800px] mx-auto px-6 pt-24 relative z-10">
        {/* HEADER PRINCIPAL TRADUCIDO */}
        {isMainHub && (
            <div className="mb-8 border-b border-white/10 pb-8">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-white uppercase mb-4">
                    {text.quant} <span className="text-blue-500">{text.mainTitle}</span>
                </h1>
            </div>
        )}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
        </div>
      </div>
    </div>
  );
}