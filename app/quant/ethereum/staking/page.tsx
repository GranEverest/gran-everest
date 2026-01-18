"use client";
import React, { useState, useEffect, useRef } from "react";
import { Lock, Hash, ExternalLink, Activity, Share2, Check } from "lucide-react";

// --- CONFIGURACIÓN DUNE: TODOS LOS CHARTS ---
// Agregamos 'id' para el deep linking
const ETH_STAKING_CHARTS = [
    // --- MACRO OVERVIEW ---
    { id: "total-eth-staked", title: "TOTAL ETH STAKED", url: "https://dune.com/embeds/1933035/3188467", span: "col-span-1" },
    { id: "staked-supply-pct", title: "STAKED % OF SUPPLY", url: "https://dune.com/embeds/1933036/3188470", span: "col-span-1" },
    { id: "market-share", title: "MARKET SHARE (ENTITIES)", url: "https://dune.com/embeds/2368976/3883672", span: "col-span-2" },
    
    // --- FLOWS ---
    { id: "deposits-withdrawals", title: "DEPOSITS VS WITHDRAWALS", url: "https://dune.com/embeds/1933048/3188490", span: "col-span-2" },
    { id: "net-staking-flow", title: "NET STAKING FLOW", url: "https://dune.com/embeds/1933075/3188537", span: "col-span-2" },

    // --- MAJOR ENTITIES ---
    { id: "lido-analytics", title: "LIDO ANALYTICS", url: "https://dune.com/embeds/2394493/3928287", span: "col-span-1" },
    { id: "coinbase-staking", title: "COINBASE STAKING", url: "https://dune.com/embeds/3383110/5677040", span: "col-span-1" },
    { id: "rocket-pool", title: "ROCKET POOL", url: "https://dune.com/embeds/2371805/3888782", span: "col-span-1" },
    { id: "binance-staking", title: "BINANCE STAKING", url: "https://dune.com/embeds/2394351/3928023", span: "col-span-1" },

    // --- DEEP DIVE & DISTRIBUTION ---
    { id: "solo-vs-pools", title: "SOLO VS POOLS", url: "https://dune.com/embeds/2394100/3928083", span: "col-span-2" },
    { id: "rewards-distribution", title: "REWARDS DISTRIBUTION", url: "https://dune.com/embeds/2381678/3905547", span: "col-span-2" },
    { id: "validator-effectiveness", title: "VALIDATOR EFFECTIVENESS", url: "https://dune.com/embeds/1933076/3188545", span: "col-span-2" },
    { id: "validator-queue", title: "VALIDATOR QUEUE STATUS", url: "https://dune.com/embeds/1933076/7082472", span: "col-span-2" },

    // --- SECTOR BREAKDOWN ---
    { id: "cex-share", title: "CEX STAKING SHARE", url: "https://dune.com/embeds/1945604/3209768", span: "col-span-1" },
    { id: "liquid-share", title: "LIQUID STAKING SHARE", url: "https://dune.com/embeds/1945549/3209702", span: "col-span-1" },
    { id: "staking-categories", title: "STAKING CATEGORIES", url: "https://dune.com/embeds/1945623/3209802", span: "col-span-1" },
    { id: "lido-flow", title: "LIDO FLOW METRICS", url: "https://dune.com/embeds/1941374/3202607", span: "col-span-1" },

    // --- PROTOCOL SPECIFIC FLOWS ---
    { id: "rocket-pool-flow", title: "ROCKET POOL FLOW", url: "https://dune.com/embeds/1941390/3202625", span: "col-span-1" },
    { id: "ether-fi", title: "ETHER.FI (RESTAKING)", url: "https://dune.com/embeds/3548849/5971664", span: "col-span-1" },
    { id: "frax-ether", title: "FRAX ETHER FLOW", url: "https://dune.com/embeds/1941392/3202627", span: "col-span-1" },
    { id: "stakewise", title: "STAKEWISE METRICS", url: "https://dune.com/embeds/1946487/3210952", span: "col-span-1" },
    
    // --- INSTITUTIONAL & OTHERS ---
    { id: "mantle-staking", title: "MANTLE STAKING", url: "https://dune.com/embeds/2394053/3927448", span: "col-span-1" },
    { id: "figment-institutional", title: "FIGMENT (INSTITUTIONAL)", url: "https://dune.com/embeds/1937676/3196733", span: "col-span-1" },
    { id: "kiln-staking", title: "KILN STAKING", url: "https://dune.com/embeds/2393992/3927352", span: "col-span-1" },
    { id: "bitcoin-suisse", title: "BITCOIN SUISSE", url: "https://dune.com/embeds/1946328/3210761", span: "col-span-1" },

    // --- FLOWS DETAILED ---
    { id: "bitcoin-suisse-flow", title: "BITCOIN SUISSE FLOW", url: "https://dune.com/embeds/1946328/3210768", span: "col-span-1" },
    { id: "kiln-flow", title: "KILN FLOW ANALYSIS", url: "https://dune.com/embeds/2393992/3927353", span: "col-span-1" },
    { id: "stakefish-metrics", title: "STAKEFISH METRICS", url: "https://dune.com/embeds/1941407/3202651", span: "col-span-1" },
    { id: "stakefish-flow", title: "STAKEFISH FLOW", url: "https://dune.com/embeds/1941408/3202653", span: "col-span-1" },
    
    // --- TAIL METRICS ---
    { id: "p2p-validator", title: "P2P VALIDATOR", url: "https://dune.com/embeds/1941407/3202667", span: "col-span-2" },
    { id: "figment-flow", title: "FIGMENT FLOW DYNAMICS", url: "https://dune.com/embeds/1937676/3202670", span: "col-span-2" },
];

export default function EthStakingPage() {
  return (
    <div>
        <h3 className="text-sm font-mono text-purple-500 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-purple-500/20 pb-2 w-fit">
            <Lock size={16}/> ETH STAKING DASHBOARD
        </h3>
        
        {/* Usamos un grid denso para aprovechar espacios */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-20">
            {ETH_STAKING_CHARTS.map((chart, i) => (
                <LazyDuneChart 
                    key={i} 
                    id={chart.id} 
                    title={chart.title} 
                    url={chart.url} 
                    span={chart.span} 
                />
            ))}
        </div>
    </div>
  );
}

// --- COMPONENTE DE CARGA DIFERIDA CON SHARE ---
function LazyDuneChart({ id, title, url, span }: { id: string, title: string, url: string, span: string }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect(); 
                }
            },
            { rootMargin: "200px" } 
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const handleShare = () => {
        const deepLink = `${window.location.origin}${window.location.pathname}#${id}`;
        navigator.clipboard.writeText(deepLink).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <div 
            id={id}
            className={`bg-[#0a0a0a] border border-white/10 p-1 rounded-sm h-[320px] flex flex-col ${span} scroll-mt-32`}
        >
            {/* Header del Chart */}
            <div className="p-3 border-b border-white/5 flex justify-between items-center bg-[#111] shrink-0">
                <span className="text-[10px] font-mono font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2 truncate">
                    <Hash size={10} className="text-purple-500"/> {title}
                </span>

                {/* Acciones (Share + Link externo) */}
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleShare}
                        className="group flex items-center gap-1 text-[9px] font-mono text-gray-600 hover:text-white transition-colors uppercase"
                        title="Copy link to this chart"
                    >
                        {isCopied ? (
                            <>
                                <span className="text-emerald-500 font-bold">COPIED</span>
                                <Check size={12} className="text-emerald-500"/>
                            </>
                        ) : (
                            <>
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity">SHARE</span>
                                <Share2 size={12} className="group-hover:text-blue-400"/>
                            </>
                        )}
                    </button>

                    <div className="h-3 w-[1px] bg-white/10"></div>

                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-white" title="Open in Dune">
                        <ExternalLink size={10}/>
                    </a>
                </div>
            </div>

            {/* Contenedor del Iframe */}
            <div 
                ref={containerRef} 
                className="relative flex-1 w-full bg-black overflow-hidden group"
            >
                {isVisible ? (
                    <iframe 
                        src={url} 
                        title={title}
                        className="absolute inset-0 w-full h-full border-none transition-opacity duration-700 opacity-0 animate-in fade-in"
                        style={{
                            opacity: 1,
                            filter: 'invert(93%) hue-rotate(180deg) contrast(85%) saturate(150%)',
                            mixBlendMode: 'normal'
                        }}
                        loading="lazy"
                    ></iframe>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
                        <Activity className="text-purple-500/20 animate-pulse" size={24} />
                        <span className="text-[9px] font-mono text-gray-700 uppercase tracking-widest">Loading Feed...</span>
                    </div>
                )}
            </div>
        </div>
    );
}