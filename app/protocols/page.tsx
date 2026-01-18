"use client";
import { useEffect, useState } from "react";
import { getProtocolIntel } from "@/lib/api";
import { ArrowLeft, ShieldCheck, AlertTriangle, TrendingUp, TrendingDown, Server, Link as LinkIcon, Activity, Database, Globe } from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useLang } from "@/lib/useLang"; 

const customStyles = `
  .bg-grid-pattern {
    background-image: linear-gradient(to right, #222 1px, transparent 1px),
                      linear-gradient(to bottom, #222 1px, transparent 1px);
    background-size: 40px 40px;
  }
`;

const t = {
  en: {
    back: "RETURN TO TERMINAL",
    badge_title: "PROTOCOL INTELLIGENCE",
    live: "LIVE FEED",
    title: "PROTOCOL",
    title_span: "INTELLIGENCE",
    desc: "DEEP DIVE ANALYTICS. AUDIT STATUS, CAPITAL FLOWS, AND MULTI-CHAIN PRESENCE. TRACKING THE INFRASTRUCTURE LAYER OF DECENTRALIZED FINANCE.",
    card_top: "TOP PROTOCOL",
    card_flow: "24H FLOW LEADER",
    card_secure: "MOST SECURE",
    card_chain: "CROSS-CHAIN KING",
    tab_proto: "PROTOCOL / CATEGORY",
    tab_chains: "CHAINS",
    tab_tvl: "TVL (SIZE)",
    tab_flow: "24H FLOW",
    tab_sec: "SECURITY / AUDITS",
    tab_link: "LINK",
    loading: "ESTABLISHING CONNECTION TO PROTOCOL NODES...",
    inflow: "INFLOW",
    outflow: "OUTFLOW",
    verified: "VERIFIED",
    unknown: "UNKNOWN",
    audits: "AUDITS VERIFIED",
    deployed: "DEPLOYED ON"
  },
  es: {
    back: "VOLVER A TERMINAL",
    badge_title: "INTELIGENCIA DE PROTOCOLOS",
    live: "FEED EN VIVO",
    title: "INTELIGENCIA DE",
    title_span: "PROTOCOLOS",
    desc: "ANALISIS PROFUNDO. ESTADO DE AUDITORIA, FLUJOS DE CAPITAL Y PRESENCIA MULTI-CADENA. RASTREANDO LA INFRAESTRUCTURA DE LAS FINANZAS DESCENTRALIZADAS.",
    card_top: "PROTOCOLO TOP",
    card_flow: "LIDER DE FLUJO 24H",
    card_secure: "MAS SEGURO",
    card_chain: "REY MULTI-CADENA",
    tab_proto: "PROTOCOLO / CATEGORIA",
    tab_chains: "REDES",
    tab_tvl: "TVL (TAMAÑO)",
    tab_flow: "FLUJO 24H",
    tab_sec: "SEGURIDAD / AUDITORIAS",
    tab_link: "ENLACE",
    loading: "ESTABLECIENDO CONEXION CON NODOS...",
    inflow: "ENTRADA",
    outflow: "SALIDA",
    verified: "VERIFICADO",
    unknown: "DESCONOCIDO",
    audits: "AUDITORIAS VERIF.",
    deployed: "DESPLEGADO EN"
  }
};

export default function ProtocolsPage() {
  const [protocols, setProtocols] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { lang } = useLang();
  const text = t[lang];

  useEffect(() => {
    getProtocolIntel().then((data) => {
      setProtocols(data);
      setLoading(false);
    });
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans pb-32 relative selection:bg-cyan-500/30">
      <style jsx global>{customStyles}</style>
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20 bg-grid-pattern"></div>

      {/* NAVBAR IDÉNTICO A STRATEGY (Sólido, Top-0, Z-100) */}
      <nav className="fixed w-full top-0 z-[100] border-b border-white/10 bg-[#050505]">
        <div className="max-w-[1920px] mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* IZQUIERDA */}
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-white transition uppercase font-mono text-xs tracking-widest group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform"/> {text.back}
          </Link>
          
          {/* DERECHA */}
          <div className="flex items-center gap-4">
             {/* BADGE IDENTIFICADOR */}
             <div className="hidden md:flex text-[10px] font-mono font-bold text-cyan-500 items-center gap-2 px-3 py-1 border border-cyan-500/30 rounded-sm bg-cyan-500/5">
                <Server size={12}/> {text.badge_title}
             </div>

             {/* BADGE LIVE FEED */}
             <div className="text-[10px] font-mono text-emerald-500 flex items-center gap-2 px-3 py-1 border border-emerald-500/30 rounded-sm bg-emerald-500/5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> {text.live}
             </div>

             <div className="scale-90">
                <ConnectButton showBalance={false} chainStatus="icon" accountStatus={{ smallScreen: 'avatar', largeScreen: 'full', }} />
             </div>
          </div>
        </div>
      </nav>

      {/* Padding superior ajustado a pt-24 para que no se corte el título */}
      <div className="relative z-10 w-full px-4 md:px-8 pt-24 max-w-[1920px] mx-auto">
        
        {/* HEADER */}
        <div className="mb-12 border-b border-white/10 pb-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-white uppercase mb-4">
                {text.title} <span className="text-cyan-500">{text.title_span}</span>
            </h1>
            <p className="font-mono text-xs text-gray-400 tracking-widest max-w-2xl leading-relaxed">
                {text.desc}
            </p>
        </div>

        {/* METRICS */}
        {!loading && protocols.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
                <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-sm">
                    <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Database size={12}/> {text.card_top}</div>
                    <div className="text-2xl font-bold text-white truncate">{protocols[0]?.name}</div>
                    <div className="text-xs font-mono text-cyan-500 mt-1">${(protocols[0]?.tvl / 1e9).toFixed(2)}B TVL</div>
                </div>
                <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-sm">
                    <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Activity size={12}/> {text.card_flow}</div>
                    <div className="text-2xl font-bold text-white truncate">
                        {protocols.reduce((prev, current) => (prev.change_1d > current.change_1d) ? prev : current)?.name}
                    </div>
                    <div className="text-xs font-mono text-emerald-500 mt-1">
                        +{protocols.reduce((prev, current) => (prev.change_1d > current.change_1d) ? prev : current)?.change_1d?.toFixed(2)}% {text.inflow}
                    </div>
                </div>
                <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-sm">
                    <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2"><ShieldCheck size={12}/> {text.card_secure}</div>
                    <div className="text-2xl font-bold text-white">AAVE</div>
                    <div className="text-xs font-mono text-gray-400 mt-1">14+ {text.audits}</div>
                </div>
                <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-sm">
                     <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Globe size={12}/> {text.card_chain}</div>
                     <div className="text-2xl font-bold text-white">UNISWAP</div>
                     <div className="text-xs font-mono text-gray-400 mt-1">{text.deployed} 18 {text.tab_chains}</div>
                </div>
            </div>
        )}

        {/* TABLE */}
        <div className="border border-white/10 bg-[#0a0a0a] rounded-sm overflow-hidden min-h-[600px]">
            <div className="grid grid-cols-12 gap-4 py-4 px-6 border-b border-white/10 bg-[#111] text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                <div className="col-span-3">{text.tab_proto}</div>
                <div className="col-span-2 text-center">{text.tab_chains}</div>
                <div className="col-span-2 text-right">{text.tab_tvl}</div>
                <div className="col-span-2 text-right">{text.tab_flow}</div>
                <div className="col-span-2 text-center">{text.tab_sec}</div>
                <div className="col-span-1 text-center">{text.tab_link}</div>
            </div>

            {loading ? (
                 <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <Server size={48} className="text-cyan-500 animate-pulse"/>
                    <p className="font-mono text-xs text-cyan-500 tracking-widest animate-pulse">{text.loading}</p>
                 </div>
            ) : (
                protocols.map((p, i) => {
                    const isInflow = p.change_1d >= 0;
                    const isAuditSolid = p.tvl > 1000000000; 
                    
                    return (
                        <div key={i} className="grid grid-cols-12 gap-4 py-4 px-6 border-b border-white/5 items-center hover:bg-white/[0.02] transition text-sm font-sans group">
                            
                            <div className="col-span-3 flex items-center gap-4">
                                <div className="text-gray-500 font-mono text-xs w-6">#{i+1}</div>
                                <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden shrink-0 border border-white/10 group-hover:border-white/30 transition">
                                    <img src={p.logo} alt={p.name} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                                </div>
                                <div>
                                    <div className="font-bold text-white uppercase tracking-tight group-hover:text-cyan-400 transition">{p.name}</div>
                                    <div className="text-[10px] font-mono text-cyan-600 uppercase tracking-wider">{p.category}</div>
                                </div>
                            </div>

                            <div className="col-span-2 flex flex-wrap justify-center gap-1 content-center">
                                {p.chains.slice(0, 5).map((chain: string, idx: number) => (
                                    <span key={idx} className="bg-white/5 border border-white/10 px-1.5 py-0.5 text-[9px] text-gray-400 font-mono rounded-sm uppercase">
                                        {chain === "Binance" ? "BSC" : chain}
                                    </span>
                                ))}
                                {p.chains.length > 5 && <span className="text-[9px] text-gray-600 font-mono py-0.5">+{p.chains.length - 5}</span>}
                            </div>

                            <div className="col-span-2 text-right">
                                <div className="text-white font-mono font-bold tracking-tighter">${(p.tvl / 1000000).toLocaleString('en-US', {maximumFractionDigits: 1})}M</div>
                                {p.mcap > 0 && (
                                    <div className="text-[9px] text-gray-600 font-mono">MCAP/TVL: {(p.mcap / p.tvl).toFixed(2)}</div>
                                )}
                            </div>

                            <div className="col-span-2 text-right">
                                <div className={`font-mono font-bold tracking-tighter flex items-center justify-end gap-1 ${isInflow ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {isInflow ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                                    {Math.abs(p.change_1d).toFixed(2)}%
                                </div>
                                <div className="text-[9px] text-gray-600 font-mono uppercase">{isInflow ? text.inflow : text.outflow}</div>
                            </div>

                            <div className="col-span-2 flex flex-col items-center justify-center">
                                {isAuditSolid ? (
                                    <div className="flex items-center gap-1 text-emerald-500 border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 rounded-sm">
                                        <ShieldCheck size={12}/>
                                        <span className="text-[9px] font-bold tracking-widest">{text.verified}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 text-orange-500 border border-orange-500/30 bg-orange-500/10 px-2 py-1 rounded-sm">
                                        <AlertTriangle size={12}/>
                                        <span className="text-[9px] font-bold tracking-widest">{text.unknown}</span>
                                    </div>
                                )}
                            </div>

                            <div className="col-span-1 text-center">
                                <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition inline-block p-2 border border-white/10 hover:border-white rounded-sm bg-black hover:bg-white/10">
                                    <LinkIcon size={14}/>
                                </a>
                            </div>

                        </div>
                    );
                })
            )}
        </div>
      </div>
    </main>
  );
}