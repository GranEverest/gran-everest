"use client"; // IMPORTANTE: Necesario para usar useLang
import React from "react";
import Link from "next/link";
import { 
    Activity, Globe, Zap, Pickaxe, ArrowRight, Timer, BarChart3, ShieldCheck, 
    Hash, Cpu, TrendingUp, TrendingDown, Anchor 
} from "lucide-react";
import { useLang } from "@/lib/useLang";

// NOTA: Movemos metadata a layout.tsx o la borramos si usamos "use client" aquí.
// Next.js no permite metadata en componentes cliente.
// Si necesitas metadata dinámica, es más complejo, pero para solucionar la traducción rápido, usa esto:

const BTC_TICKER_DATA = [
    { label: "BTC PRICE", value: "$64,230.50", change: "+2.1%", isPositive: true, icon: Hash, iconColor: "text-orange-500" },
    { label: "HASHRATE", value: "625 EH/s", change: "ATH", isPositive: true, icon: Cpu, iconColor: "text-blue-500" },
    { label: "MEMPOOL FEES", value: "45 sat/vB", change: "HIGH", isPositive: false, icon: Activity, iconColor: "text-red-500" },
    { label: "ETF NET FLOW", value: "+$450M", change: "DAILY", isPositive: true, icon: Globe, iconColor: "text-emerald-500" },
    { label: "LN CAPACITY", value: "5,400 BTC", change: "+0.5%", isPositive: true, icon: Zap, iconColor: "text-yellow-500" },
    { label: "DOMINANCE", value: "54.2%", change: "+0.1%", isPositive: true, icon: Anchor, iconColor: "text-gray-400" },
    { label: "MINER REVENUE", value: "$32M", change: "-1.2%", isPositive: false, icon: Pickaxe, iconColor: "text-purple-500" },
];

export default function BitcoinHub() {
  const { lang } = useLang();

  // DICCIONARIO
  const content = {
    en: {
        title: "BITCOIN",
        subtitle: "INTELLIGENCE VECTORS",
        select: "SELECT A DATA CATEGORY TO INITIALIZE ANALYSIS",
        online: "ONLINE",
        construct: "CONSTRUCT",
        open: "OPEN DASHBOARD",
        footer_sec: "BITCOIN NETWORK: SECURE",
        footer_sync: "SYNC STATUS: 100%",
        modules: [
            { id: "fees", title: "TRANSACTION & FEES", desc: "Mempool analysis, sat/vB rates, tx volume and Runes/Ordinals." },
            { id: "halving", title: "HALVING CYCLES", desc: "Stock-to-Flow models, days since last halving, inflation & price projection." },
            { id: "etf", title: "INSTITUTIONAL ETF FLOWS", desc: "Daily Inflows/Outflows for BlackRock (IBIT), Fidelity & Grayscale." },
            { id: "mining", title: "MINER ECONOMICS", desc: "Hashrate, difficulty, miner revenue and Hash Ribbons capitulation." },
        ]
    },
    es: {
        title: "BITCOIN",
        subtitle: "VECTORES DE INTELIGENCIA",
        select: "SELECCIONA UNA CATEGORÍA DE DATOS PARA INICIAR EL ANÁLISIS",
        online: "EN LÍNEA",
        construct: "EN CONSTRUCCIÓN",
        open: "ABRIR DASHBOARD",
        footer_sec: "RED BITCOIN: SEGURA",
        footer_sync: "ESTADO DE SINCRONIZACIÓN: 100%",
        modules: [
            { id: "fees", title: "TRANSACCIONES Y FEES", desc: "Análisis del Mempool, tasas sat/vB, volumen y Runes/Ordinals." },
            { id: "halving", title: "CICLOS DE HALVING", desc: "Modelos Stock-to-Flow, días desde el último halving e inflación." },
            { id: "etf", title: "FLUJOS DE ETF INSTITUCIONALES", desc: "Entradas/Salidas diarias de BlackRock (IBIT), Fidelity y Grayscale." },
            { id: "mining", title: "ECONOMÍA MINERA", desc: "Hashrate, dificultad, ingresos de mineros y capitulación." },
        ]
    }
  };

  const t = content[lang as keyof typeof content] || content.en;

  // Estilos estáticos
  const styles = {
    fees: { icon: BarChart3, path: "/quant/bitcoin/fees", status: "LIVE", color: "text-red-500", bg: "bg-red-500/5", border: "border-red-500/20 hover:border-red-500" },
    halving: { icon: Timer, path: "/quant/bitcoin/halving", status: "DEV", color: "text-orange-500", bg: "bg-orange-500/5", border: "border-orange-500/20 hover:border-orange-500" },
    etf: { icon: Globe, path: "/quant/bitcoin/etf", status: "DEV", color: "text-blue-500", bg: "bg-blue-500/5", border: "border-blue-500/20 hover:border-blue-500" },
    mining: { icon: Pickaxe, path: "/quant/bitcoin/mining", status: "DEV", color: "text-purple-500", bg: "bg-purple-500/5", border: "border-purple-500/20 hover:border-purple-500 opacity-70" },
  };

  return (
    <div className="w-full">
        {/* TICKER (DATA REAL, NO TRADUCIMOS VALORES, SOLO LABELS SI QUISIERAS) */}
        <style>{`
            @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
            .animate-marquee { animation: marquee 60s linear infinite; }
            .animate-marquee:hover { animation-play-state: paused; }
        `}</style>

        <div className="w-full border-b border-white/10 bg-[#050505] overflow-hidden relative h-10 flex items-center mb-12">
            <div className="absolute left-0 top-0 bottom-0 z-20 bg-[#050505] px-4 flex items-center border-r border-white/10 shadow-[5px_0_10px_#050505]">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>
                    <span className="text-[10px] font-mono font-bold text-gray-200 tracking-widest whitespace-nowrap">
                        BTC NETWORK
                    </span>
                </div>
            </div>
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
          <div className="mb-12 border-l-2 border-orange-500 pl-6 animate-in slide-in-from-left duration-500">
            <h2 className="text-3xl font-bold text-white tracking-tighter mb-2">{t.title} <span className="text-gray-500">{t.subtitle}</span></h2>
            <p className="text-sm font-mono text-gray-500 uppercase tracking-widest">{t.select}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in duration-500 delay-100">
            {t.modules.map((mod) => {
                const style = styles[mod.id as keyof typeof styles];
                return (
                  <Link key={mod.id} href={style.status === "DEV" ? "#" : style.path} className={`h-full ${style.status === "DEV" ? "cursor-not-allowed" : ""}`}>
                    <div className={`group relative h-full min-h-[280px] bg-[#0a0a0a] border ${style.border} p-8 rounded-sm transition-all duration-300 hover:bg-[#0f0f0f] flex flex-col`}>
                        <div className="absolute top-4 right-4">
                            <span className={`text-[9px] font-mono font-bold px-2 py-1 rounded-sm border ${style.status === 'LIVE' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' : 'border-gray-700 text-gray-500 bg-gray-800'}`}>
                                {style.status === 'LIVE' ? <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/> {t.online}</span> : t.construct}
                            </span>
                        </div>
                        <div className="flex-grow">
                            <div className={`w-12 h-12 flex items-center justify-center rounded-sm ${style.bg} ${style.color} mb-6`}>
                                <style.icon size={24} />
                            </div>
                            <h3 className={`text-xl font-bold text-white group-hover:${style.color.replace('text-', 'text-')} transition-colors mb-2`}>
                                {mod.title}
                            </h3>
                            <p className="text-sm font-mono text-gray-500 leading-relaxed max-w-sm">
                                {mod.desc}
                            </p>
                        </div>
                        {style.status === "LIVE" && (
                            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-gray-600 group-hover:text-white transition-colors uppercase tracking-widest mt-8 pt-4 border-t border-white/5">
                                {t.open} <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform"/>
                            </div>
                        )}
                    </div>
                  </Link>
                )
            })}
          </div>
          
          <div className="mt-12 pt-8 border-t border-white/5 flex justify-between text-[10px] font-mono text-gray-600 uppercase">
            <div className="flex items-center gap-2"><ShieldCheck size={12}/> {t.footer_sec}</div>
            <div className="flex items-center gap-2"><Activity size={12}/> {t.footer_sync}</div>
          </div>
      </div>
    </div>
  );
}