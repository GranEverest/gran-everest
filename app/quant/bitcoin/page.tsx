import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { 
    Activity, Globe, Zap, Pickaxe, ArrowRight, Timer, BarChart3, ShieldCheck, 
    Hash, Cpu, TrendingUp, TrendingDown, Anchor 
} from "lucide-react";

// --- METADATA SEO ---
export const metadata: Metadata = {
    title: "Bitcoin Intelligence Hub | Gran Everest Terminal",
    description: "Institutional-grade Bitcoin analytics: Halving cycles, Fee markets, Miner economics, and On-chain metrics.",
};

// --- DATOS DEL TICKER (BTC VERSION) ---
const BTC_TICKER_DATA = [
    { label: "BTC PRICE", value: "$64,230.50", change: "+2.1%", isPositive: true, icon: Hash, iconColor: "text-orange-500" },
    { label: "HASHRATE", value: "625 EH/s", change: "ATH", isPositive: true, icon: Cpu, iconColor: "text-blue-500" },
    { label: "MEMPOOL FEES", value: "45 sat/vB", change: "HIGH", isPositive: false, icon: Activity, iconColor: "text-red-500" },
    { label: "ETF NET FLOW", value: "+$450M", change: "DAILY", isPositive: true, icon: Globe, iconColor: "text-emerald-500" },
    { label: "LN CAPACITY", value: "5,400 BTC", change: "+0.5%", isPositive: true, icon: Zap, iconColor: "text-yellow-500" },
    { label: "DOMINANCE", value: "54.2%", change: "+0.1%", isPositive: true, icon: Anchor, iconColor: "text-gray-400" },
    { label: "MINER REVENUE", value: "$32M", change: "-1.2%", isPositive: false, icon: Pickaxe, iconColor: "text-purple-500" },
];

// --- TUS CATEGORÍAS DE ANÁLISIS ---
const MODULES = [
  {
    id: "fees",
    title: "TRANSACTION & FEES",
    desc: "Análisis del Mempool, tasas sat/vB, volumen de transacciones y Runes/Ordinals.",
    icon: BarChart3,
    path: "/quant/bitcoin/fees",
    status: "LIVE",
    color: "text-red-500",
    bg: "bg-red-500/5",
    border: "border-red-500/20 hover:border-red-500"
  },
  {
    id: "halving",
    title: "HALVING CYCLES",
    desc: "Modelos Stock-to-Flow, días desde el último halving, inflación y proyección de precios.",
    icon: Timer,
    path: "/quant/bitcoin/halving",
    status: "DEV",
    color: "text-orange-500",
    bg: "bg-orange-500/5",
    border: "border-orange-500/20 hover:border-orange-500"
  },
  {
    id: "etf",
    title: "INSTITUTIONAL ETF FLOWS",
    desc: "Entradas/Salidas diarias de BlackRock (IBIT), Fidelity y Grayscale. Datos de custodia.",
    icon: Globe,
    path: "/quant/bitcoin/etf",
    status: "DEV", 
    color: "text-blue-500",
    bg: "bg-blue-500/5",
    border: "border-blue-500/20 hover:border-blue-500"
  },
  {
    id: "mining",
    title: "MINER ECONOMICS",
    desc: "Hashrate, dificultad, ingresos de mineros y capitulación (Hash Ribbons).",
    icon: Pickaxe,
    path: "/quant/bitcoin/mining",
    status: "DEV",
    color: "text-purple-500",
    bg: "bg-purple-500/5",
    border: "border-purple-500/20 hover:border-purple-500 opacity-70"
  }
];

export default function BitcoinHub() {
  return (
    <div className="w-full">
        {/* ========================================= */}
        {/* 1. BARRA DE TICKER (ESTILO WALL STREET)   */}
        {/* ========================================= */}
        <style>{`
            @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
            .animate-marquee { animation: marquee 60s linear infinite; }
            .animate-marquee:hover { animation-play-state: paused; }
        `}</style>

        <div className="w-full border-b border-white/10 bg-[#050505] overflow-hidden relative h-10 flex items-center mb-12">
            {/* Etiqueta Izquierda */}
            <div className="absolute left-0 top-0 bottom-0 z-20 bg-[#050505] px-4 flex items-center border-r border-white/10 shadow-[5px_0_10px_#050505]">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>
                    <span className="text-[10px] font-mono font-bold text-gray-200 tracking-widest whitespace-nowrap">
                        BTC NETWORK
                    </span>
                </div>
            </div>
            {/* Cinta Animada */}
            <div className="flex animate-marquee whitespace-nowrap pl-32">
                {[...BTC_TICKER_DATA, ...BTC_TICKER_DATA, ...BTC_TICKER_DATA].map((item, i) => (
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
      
      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-[1600px] mx-auto px-6 pb-24">
          
          {/* HERO SECTION */}
          <div className="mb-12 border-l-2 border-orange-500 pl-6 animate-in slide-in-from-left duration-500">
            <h2 className="text-3xl font-bold text-white tracking-tighter mb-2">BITCOIN <span className="text-gray-500">INTELLIGENCE VECTORS</span></h2>
            <p className="text-sm font-mono text-gray-500 uppercase tracking-widest">
                SELECT A DATA CATEGORY TO INITIALIZE ANALYSIS
            </p>
          </div>

          {/* GRID DE MÓDULOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in duration-500 delay-100">
            {MODULES.map((mod) => (
              <Link key={mod.id} href={mod.status === "DEV" ? "#" : mod.path} className={`h-full ${mod.status === "DEV" ? "cursor-not-allowed" : ""}`}>
                <div className={`group relative h-full min-h-[280px] bg-[#0a0a0a] border ${mod.border} p-8 rounded-sm transition-all duration-300 hover:bg-[#0f0f0f] flex flex-col`}>
                    
                    {/* STATUS BADGE */}
                    <div className="absolute top-4 right-4">
                        <span className={`text-[9px] font-mono font-bold px-2 py-1 rounded-sm border ${mod.status === 'LIVE' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' : 'border-gray-700 text-gray-500 bg-gray-800'}`}>
                            {mod.status === 'LIVE' ? <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/> ONLINE</span> : 'CONSTRUCT'}
                        </span>
                    </div>

                    <div className="flex-grow">
                        <div className={`w-12 h-12 flex items-center justify-center rounded-sm ${mod.bg} ${mod.color} mb-6`}>
                            <mod.icon size={24} />
                        </div>
                        <h3 className={`text-xl font-bold text-white group-hover:${mod.color.replace('text-', 'text-')} transition-colors mb-2`}>
                            {mod.title}
                        </h3>
                        <p className="text-sm font-mono text-gray-500 leading-relaxed max-w-sm">
                            {mod.desc}
                        </p>
                    </div>

                    {mod.status === "LIVE" && (
                        <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-gray-600 group-hover:text-white transition-colors uppercase tracking-widest mt-8 pt-4 border-t border-white/5">
                            OPEN DASHBOARD <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform"/>
                        </div>
                    )}
                </div>
              </Link>
            ))}
          </div>
          
          {/* FOOTER DE DATOS */}
          <div className="mt-12 pt-8 border-t border-white/5 flex justify-between text-[10px] font-mono text-gray-600 uppercase">
            <div className="flex items-center gap-2"><ShieldCheck size={12}/> BITCOIN NETWORK: SECURE</div>
            <div className="flex items-center gap-2"><Activity size={12}/> SYNC STATUS: 100%</div>
          </div>
      </div>
    </div>
  );
}