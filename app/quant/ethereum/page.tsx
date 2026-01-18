"use client";
import React from "react";
import Link from "next/link";
import { 
    Lock, Globe, Layers, Flame, ArrowRight, Activity, ShieldCheck, 
    Hash, Zap, TrendingUp, TrendingDown, Droplets 
} from "lucide-react";
import { useLang } from "@/lib/useLang";

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

export default function EthereumHub() {
  const { lang } = useLang();

  const content = {
    en: {
        title: "ETHEREUM",
        subtitle: "INTELLIGENCE HUB",
        select: "SELECT A DATA MODULE TO INITIALIZE ANALYSIS",
        online: "ONLINE",
        construct: "CONSTRUCT",
        open: "ACCESS TERMINAL",
        footer_sec: "ETHEREUM CONSENSUS: VALIDATED",
        footer_sync: "LATENCY: 14ms",
        modules: [
            { id: "staking", title: "ETH STAKING DASHBOARD", desc: "Validator flows, LSD market share (Lido, RocketPool) and institutional staking metrics." },
            { id: "etf", title: "ETF INSTITUTIONAL TRACKER", desc: "Real-time Spot ETF Inflows/Outflows, custody data and Wall Street adoption." },
            { id: "l2", title: "L2 WARS (SCALING)", desc: "Arbitrum vs Optimism vs Base. TPS comparison, active addresses and bridge TVL rotation." },
            { id: "gas", title: "GAS & MEV ECONOMICS", desc: "Burn rates (EIP-1559), Gas price heatmaps and MEV extraction analysis." },
        ]
    },
    es: {
        title: "ETHEREUM",
        subtitle: "HUB DE INTELIGENCIA",
        select: "SELECCIONA UN MÓDULO DE DATOS PARA INICIAR EL ANÁLISIS",
        online: "EN LÍNEA",
        construct: "EN CONSTRUCCIÓN",
        open: "ACCEDER A TERMINAL",
        footer_sec: "CONSENSO ETHEREUM: VALIDADO",
        footer_sync: "LATENCIA: 14ms",
        modules: [
            { id: "staking", title: "PANEL DE STAKING ETH", desc: "Flujos de validadores, cuota de mercado LSD (Lido, RocketPool) y métricas institucionales." },
            { id: "etf", title: "RASTREADOR ETF INSTITUCIONAL", desc: "Entradas/Salidas en tiempo real de ETFs Spot, datos de custodia y adopción." },
            { id: "l2", title: "GUERRAS L2 (ESCALADO)", desc: "Arbitrum vs Optimism vs Base. Comparación de TPS y rotación de TVL en puentes." },
            { id: "gas", title: "ECONOMÍA DE GAS Y MEV", desc: "Tasas de quema (EIP-1559), mapas de calor de precios de Gas y extracción de MEV." },
        ]
    }
  };

  const t = content[lang as keyof typeof content] || content.en;

  const styles = {
    staking: { icon: Lock, path: "/quant/ethereum/staking", status: "LIVE", color: "text-purple-500", bg: "bg-purple-500/5", border: "border-purple-500/20 hover:border-purple-500" },
    etf: { icon: Globe, path: "/quant/ethereum/etf", status: "LIVE", color: "text-blue-500", bg: "bg-blue-500/5", border: "border-blue-500/20 hover:border-blue-500" },
    l2: { icon: Layers, path: "/quant/ethereum/l2", status: "DEV", color: "text-emerald-500", bg: "bg-emerald-500/5", border: "border-emerald-500/20 hover:border-emerald-500 opacity-60" },
    gas: { icon: Flame, path: "/quant/ethereum/gas", status: "DEV", color: "text-orange-500", bg: "bg-orange-500/5", border: "border-orange-500/20 hover:border-orange-500 opacity-60" },
  };

  return (
    <div className="w-full">
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 60s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
      `}</style>
      <div className="w-full border-b border-white/10 bg-[#050505] overflow-hidden relative h-10 flex items-center mb-12">
            <div className="absolute left-0 top-0 bottom-0 z-20 bg-[#050505] px-4 flex items-center border-r border-white/10 shadow-[5px_0_10px_#050505]">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                    <span className="text-[10px] font-mono font-bold text-gray-200 tracking-widest whitespace-nowrap">ETH NETWORK</span>
                </div>
            </div>
            <div className="flex animate-marquee whitespace-nowrap pl-32">
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

      <div className="mb-12 border-l-2 border-white/20 pl-6 animate-in slide-in-from-left duration-500">
        <h2 className="text-3xl font-bold text-white tracking-tighter mb-2">{t.title} <span className="text-gray-500">{t.subtitle}</span></h2>
        <p className="text-sm font-mono text-gray-500 uppercase tracking-widest">{t.select}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in duration-500 delay-100">
        {t.modules.map((mod) => {
            const style = styles[mod.id as keyof typeof styles];
            return (
              <Link key={mod.id} href={style.status === "DEV" ? "#" : style.path} className={style.status === "DEV" ? "cursor-not-allowed" : ""}>
                <div className={`group relative h-full bg-[#0a0a0a] border ${style.border} p-8 rounded-sm transition-all duration-300 hover:bg-[#0f0f0f]`}>
                    <div className="absolute top-4 right-4">
                        <span className={`text-[9px] font-mono font-bold px-2 py-1 rounded-sm border ${style.status === 'LIVE' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' : 'border-gray-700 text-gray-500 bg-gray-800'}`}>
                            {style.status === 'LIVE' ? <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/> {t.online}</span> : t.construct}
                        </span>
                    </div>
                    <div className="mb-6">
                        <div className={`w-12 h-12 flex items-center justify-center rounded-sm ${style.bg} ${style.color} mb-4`}>
                            <style.icon size={24} />
                        </div>
                        <h3 className={`text-xl font-bold text-white group-hover:${style.color.replace('text-', 'text-')} transition-colors mb-2`}>
                            {mod.title}
                        </h3>
                        <p className="text-xs font-mono text-gray-500 leading-relaxed max-w-sm">{mod.desc}</p>
                    </div>
                    {style.status === "LIVE" && (
                        <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-gray-600 group-hover:text-white transition-colors uppercase tracking-widest">
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
  );
}