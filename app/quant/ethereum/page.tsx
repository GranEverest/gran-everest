"use client";
import React from "react";
import Link from "next/link";
import { Lock, Globe, Layers, Flame, ArrowRight, Activity, ShieldCheck, Construction } from "lucide-react";

const MODULES = [
  {
    id: "staking",
    title: "ETH STAKING DASHBOARD",
    desc: "Análisis profundo de flujos de validadores, cuota de mercado de LSDs (Lido, RocketPool) y métricas de staking institucional.",
    icon: Lock,
    path: "/quant/ethereum/staking",
    status: "LIVE",
    color: "text-purple-500",
    bg: "bg-purple-500/5",
    border: "border-purple-500/20 hover:border-purple-500"
  },
  {
    id: "etf",
    title: "ETF INSTITUTIONAL TRACKER",
    desc: "Rastreo en tiempo real de entradas/salidas de ETFs Spot, datos de custodia y adopción de Wall Street.",
    icon: Globe,
    path: "/quant/ethereum/etf",
    status: "LIVE", // Lo marcamos como Live o Beta
    color: "text-blue-500",
    bg: "bg-blue-500/5",
    border: "border-blue-500/20 hover:border-blue-500"
  },
  {
    id: "l2",
    title: "L2 WARS (SCALING)",
    desc: "Arbitrum vs Optimism vs Base. Comparación de TPS, direcciones activas y rotación de TVL en puentes.",
    icon: Layers,
    path: "/quant/ethereum/l2", // Asegúrate de crear esta página en el futuro
    status: "DEV",
    color: "text-emerald-500",
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/20 hover:border-emerald-500 opacity-60"
  },
  {
    id: "gas",
    title: "GAS & MEV ECONOMICS",
    desc: "Tasas de quema (EIP-1559), mapas de calor de precios de Gas y análisis de extracción de MEV.",
    icon: Flame,
    path: "/quant/ethereum/gas", // Asegúrate de crear esta página en el futuro
    status: "DEV",
    color: "text-orange-500",
    bg: "bg-orange-500/5",
    border: "border-orange-500/20 hover:border-orange-500 opacity-60"
  }
];

export default function EthereumHub() {
  return (
    <div className="w-full">
      
      {/* HERO DEL HUB */}
      <div className="mb-12 border-l-2 border-white/20 pl-6">
        <h2 className="text-3xl font-bold text-white tracking-tighter mb-2">ETHEREUM <span className="text-gray-500">INTELLIGENCE HUB</span></h2>
        <p className="text-sm font-mono text-gray-500 uppercase tracking-widest">
            SELECCIONA UN MÓDULO DE DATOS PARA INICIAR EL ANÁLISIS
        </p>
      </div>

      {/* GRILLA DE MÓDULOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MODULES.map((mod) => (
          <Link key={mod.id} href={mod.status === "DEV" ? "#" : mod.path} className={mod.status === "DEV" ? "cursor-not-allowed" : ""}>
            <div className={`group relative h-full bg-[#0a0a0a] border ${mod.border} p-8 rounded-sm transition-all duration-300 hover:bg-[#0f0f0f]`}>
                
                {/* STATUS BADGE */}
                <div className="absolute top-4 right-4">
                    <span className={`text-[9px] font-mono font-bold px-2 py-1 rounded-sm border ${mod.status === 'LIVE' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' : 'border-gray-700 text-gray-500 bg-gray-800'}`}>
                        {mod.status === 'LIVE' ? <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/> ONLINE</span> : 'CONSTRUCT'}
                    </span>
                </div>

                <div className="mb-6">
                    <div className={`w-12 h-12 flex items-center justify-center rounded-sm ${mod.bg} ${mod.color} mb-4`}>
                        <mod.icon size={24} />
                    </div>
                    <h3 className={`text-xl font-bold text-white group-hover:${mod.color.replace('text-', 'text-')} transition-colors mb-2`}>
                        {mod.title}
                    </h3>
                    <p className="text-xs font-mono text-gray-500 leading-relaxed max-w-sm">
                        {mod.desc}
                    </p>
                </div>

                {mod.status === "LIVE" && (
                    <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-gray-600 group-hover:text-white transition-colors uppercase tracking-widest">
                        ACCESS TERMINAL <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform"/>
                    </div>
                )}
            </div>
          </Link>
        ))}
      </div>

      {/* SYSTEM FOOTER */}
      <div className="mt-12 pt-8 border-t border-white/5 flex justify-between text-[10px] font-mono text-gray-600 uppercase">
        <div className="flex items-center gap-2"><ShieldCheck size={12}/> DATA INTEGRITY: VERIFIED</div>
        <div className="flex items-center gap-2"><Activity size={12}/> LATENCY: 14ms</div>
      </div>

    </div>
  );
}