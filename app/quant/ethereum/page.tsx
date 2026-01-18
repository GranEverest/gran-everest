import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { 
    Lock, Globe, Layers, Flame, ArrowRight, Activity, ShieldCheck, 
    Hash, Zap, TrendingUp, TrendingDown, Droplets 
} from "lucide-react";

// --- 1. METADATA (SEO PARA GOOGLE) ---
export const metadata: Metadata = {
  title: "Ethereum Intelligence Hub | Gran Everest Terminal",
  description: "Institutional-grade Ethereum analytics: Staking dashboard, ETF flows, L2 scaling metrics, and Gas economics.",
  keywords: ["Ethereum Analytics", "ETH Staking", "Lido Data", "L2 Wars", "Arbitrum", "Base", "Optimism", "Crypto ETF"],
};

// --- 2. DATOS DEL TICKER (BARRA SUPERIOR) ---
// Nota: Definimos los iconos aquí para usarlos directamente en el renderizado
const ETH_TICKER_DATA = [
    { label: "ETH PRICE", value: "$2,485.20", change: "+1.2%", isPositive: true, icon: Hash, iconColor: "text-blue-500" },
    { label: "GAS (GWEI)", value: "12", change: "LOW", isPositive: true, icon: Zap, iconColor: "text-yellow-500" },
    { label: "BURN RATE", value: "3.4 ETH/min", change: "ULTRASOUND", isPositive: true, icon: Flame, iconColor: "text-orange-500" },
    { label: "STAKING APR", value: "3.8%", change: "STABLE", isPositive: true, icon: Droplets, iconColor: "text-emerald-500" },
    { label: "L2 TPS", value: "145.2", change: "+5.4%", isPositive: true, icon: Layers, iconColor: "text-purple-500" },
    { label: "DOMINANCE", value: "18.1%", change: "-0.2%", isPositive: false, icon: Activity, iconColor: "text-gray-500" },
    { label: "TOTAL STAKED", value: "32.5M ETH", change: "+0.1%", isPositive: true, icon: Hash, iconColor: "text-blue-500" },
    { label: "VALIDATORS", value: "980,120", change: "ACTIVE", isPositive: true, icon: Activity, iconColor: "text-emerald-500" },
];

// --- 3. DATOS DE LOS MÓDULOS (TU MENÚ ORIGINAL) ---
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
    status: "LIVE", 
    color: "text-blue-500",
    bg: "bg-blue-500/5",
    border: "border-blue-500/20 hover:border-blue-500"
  },
  {
    id: "l2",
    title: "L2 WARS (SCALING)",
    desc: "Arbitrum vs Optimism vs Base. Comparación de TPS, direcciones activas y rotación de TVL en puentes.",
    icon: Layers,
    path: "/quant/ethereum/l2",
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
    path: "/quant/ethereum/gas",
    status: "DEV",
    color: "text-orange-500",
    bg: "bg-orange-500/5",
    border: "border-orange-500/20 hover:border-orange-500 opacity-60"
  }
];

export default function EthereumHub() {
  return (
    <div className="w-full">
      
      {/* ========================================= */}
      {/* 1. BARRA DE TICKER (ESTILO WALL STREET)   */}
      {/* ========================================= */}
      {/* Estilos CSS Inline para la animación (Server Component Friendly) */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 60s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="w-full border-b border-white/10 bg-[#050505] overflow-hidden relative h-10 flex items-center mb-12">
            {/* Etiqueta fija a la izquierda (Tapa la cinta al pasar por debajo) */}
            <div className="absolute left-0 top-0 bottom-0 z-20 bg-[#050505] px-4 flex items-center border-r border-white/10 shadow-[5px_0_10px_#050505]">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                    <span className="text-[10px] font-mono font-bold text-gray-200 tracking-widest whitespace-nowrap">
                        ETH NETWORK
                    </span>
                </div>
            </div>

            {/* Cinta deslizante animada */}
            <div className="flex animate-marquee whitespace-nowrap pl-32">
                {/* Duplicamos los datos varias veces para que el loop sea perfecto e infinito */}
                {[...ETH_TICKER_DATA, ...ETH_TICKER_DATA, ...ETH_TICKER_DATA, ...ETH_TICKER_DATA].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 px-6 border-r border-white/5 opacity-80 hover:opacity-100 transition-opacity">
                        <item.icon size={12} className={item.iconColor}/>
                        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">{item.label}</span>
                        <span className="text-[11px] font-mono font-bold text-white">{item.value}</span>
                        <span className={`text-[9px] font-mono flex items-center gap-1 ${item.isPositive ? "text-emerald-500" : "text-red-500"}`}>
                            {item.isPositive ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                            {item.change}
                        </span>
                    </div>
                ))}
            </div>
      </div>

      {/* ========================================= */}
      {/* 2. TU HUB ORIGINAL (SELECCIÓN DE MÓDULOS) */}
      {/* ========================================= */}
      
      {/* HERO */}
      <div className="mb-12 border-l-2 border-white/20 pl-6 animate-in slide-in-from-left duration-500">
        <h2 className="text-3xl font-bold text-white tracking-tighter mb-2">ETHEREUM <span className="text-gray-500">INTELLIGENCE HUB</span></h2>
        <p className="text-sm font-mono text-gray-500 uppercase tracking-widest">
            SELECCIONA UN MÓDULO DE DATOS PARA INICIAR EL ANÁLISIS
        </p>
      </div>

      {/* GRILLA DE MÓDULOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in duration-500 delay-100">
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