"use client";
import React, { useState, useEffect, useRef } from "react";
import { Lock, Database, Hash, ExternalLink, Activity } from "lucide-react";

// --- CONFIGURACIÓN DUNE: TODOS LOS CHARTS ---
const ETH_STAKING_CHARTS = [
    // --- MACRO OVERVIEW ---
    { title: "TOTAL ETH STAKED", url: "https://dune.com/embeds/1933035/3188467", span: "col-span-1" },
    { title: "STAKED % OF SUPPLY", url: "https://dune.com/embeds/1933036/3188470", span: "col-span-1" },
    { title: "MARKET SHARE (ENTITIES)", url: "https://dune.com/embeds/2368976/3883672", span: "col-span-2" },
    
    // --- FLOWS ---
    { title: "DEPOSITS VS WITHDRAWALS", url: "https://dune.com/embeds/1933048/3188490", span: "col-span-2" },
    { title: "NET STAKING FLOW", url: "https://dune.com/embeds/1933075/3188537", span: "col-span-2" },

    // --- MAJOR ENTITIES ---
    { title: "LIDO ANALYTICS", url: "https://dune.com/embeds/2394493/3928287", span: "col-span-1" },
    { title: "COINBASE STAKING", url: "https://dune.com/embeds/3383110/5677040", span: "col-span-1" },
    { title: "ROCKET POOL", url: "https://dune.com/embeds/2371805/3888782", span: "col-span-1" },
    { title: "BINANCE STAKING", url: "https://dune.com/embeds/2394351/3928023", span: "col-span-1" },

    // --- DEEP DIVE & DISTRIBUTION ---
    { title: "SOLO VS POOLS", url: "https://dune.com/embeds/2394100/3928083", span: "col-span-2" },
    { title: "REWARDS DISTRIBUTION", url: "https://dune.com/embeds/2381678/3905547", span: "col-span-2" },
    { title: "VALIDATOR EFFECTIVENESS", url: "https://dune.com/embeds/1933076/3188545", span: "col-span-2" },
    { title: "VALIDATOR QUEUE STATUS", url: "https://dune.com/embeds/1933076/7082472", span: "col-span-2" },

    // --- SECTOR BREAKDOWN ---
    { title: "CEX STAKING SHARE", url: "https://dune.com/embeds/1945604/3209768", span: "col-span-1" },
    { title: "LIQUID STAKING SHARE", url: "https://dune.com/embeds/1945549/3209702", span: "col-span-1" },
    { title: "STAKING CATEGORIES", url: "https://dune.com/embeds/1945623/3209802", span: "col-span-1" },
    { title: "LIDO FLOW METRICS", url: "https://dune.com/embeds/1941374/3202607", span: "col-span-1" },

    // --- PROTOCOL SPECIFIC FLOWS ---
    { title: "ROCKET POOL FLOW", url: "https://dune.com/embeds/1941390/3202625", span: "col-span-1" },
    { title: "ETHER.FI (RESTAKING)", url: "https://dune.com/embeds/3548849/5971664", span: "col-span-1" },
    { title: "FRAX ETHER FLOW", url: "https://dune.com/embeds/1941392/3202627", span: "col-span-1" },
    { title: "STAKEWISE METRICS", url: "https://dune.com/embeds/1946487/3210952", span: "col-span-1" },
    
    // --- INSTITUTIONAL & OTHERS ---
    { title: "MANTLE STAKING", url: "https://dune.com/embeds/2394053/3927448", span: "col-span-1" },
    { title: "FIGMENT (INSTITUTIONAL)", url: "https://dune.com/embeds/1937676/3196733", span: "col-span-1" },
    { title: "KILN STAKING", url: "https://dune.com/embeds/2393992/3927352", span: "col-span-1" },
    { title: "BITCOIN SUISSE", url: "https://dune.com/embeds/1946328/3210761", span: "col-span-1" },

    // --- FLOWS DETAILED ---
    { title: "BITCOIN SUISSE FLOW", url: "https://dune.com/embeds/1946328/3210768", span: "col-span-1" },
    { title: "KILN FLOW ANALYSIS", url: "https://dune.com/embeds/2393992/3927353", span: "col-span-1" },
    { title: "STAKEFISH METRICS", url: "https://dune.com/embeds/1941407/3202651", span: "col-span-1" },
    { title: "STAKEFISH FLOW", url: "https://dune.com/embeds/1941408/3202653", span: "col-span-1" },
    
    // --- TAIL METRICS ---
    { title: "P2P VALIDATOR", url: "https://dune.com/embeds/1941407/3202667", span: "col-span-2" },
    { title: "FIGMENT FLOW DYNAMICS", url: "https://dune.com/embeds/1937676/3202670", span: "col-span-2" },
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
                <LazyDuneChart key={i} title={chart.title} url={chart.url} span={chart.span} />
            ))}
        </div>
    </div>
  );
}

// --- COMPONENTE DE CARGA DIFERIDA (LAZY LOAD) ---
// Este componente solo carga el iframe cuando el usuario hace scroll hacia él.
function LazyDuneChart({ title, url, span }: { title: string, url: string, span: string }) {
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect(); // Dejar de observar una vez cargado
                }
            },
            { rootMargin: "200px" } // Cargar 200px antes de que aparezca en pantalla
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div className={`bg-[#0a0a0a] border border-white/10 p-1 rounded-sm h-[320px] flex flex-col ${span}`}>
            {/* Header del Chart */}
            <div className="p-3 border-b border-white/5 flex justify-between items-center bg-[#111] shrink-0">
                <span className="text-[10px] font-mono font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2 truncate">
                    <Hash size={10} className="text-purple-500"/> {title}
                </span>
                <ExternalLink size={10} className="text-gray-600 hover:text-white cursor-pointer"/>
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
                        // ESTILOS CRÍTICOS:
                        // 1. absolute inset-0: Fuerza al iframe a llenar el contenedor
                        // 2. filter: Invierte colores para "Dark Mode" falso
                        // 3. pointer-events-none: Evita scroll dentro del iframe (opcional, quitalo si quieres interactuar)
                        className="absolute inset-0 w-full h-full border-none transition-opacity duration-700 opacity-0 animate-in fade-in"
                        style={{
                            opacity: 1,
                            filter: 'invert(93%) hue-rotate(180deg) contrast(90%) grayscale(20%)',
                            mixBlendMode: 'normal'
                        }}
                        loading="lazy"
                    ></iframe>
                ) : (
                    // Placeholder de carga (Skeleton) para mejorar UX
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
                        <Activity className="text-purple-500/20 animate-pulse" size={24} />
                        <span className="text-[9px] font-mono text-gray-700 uppercase tracking-widest">Loading Feed...</span>
                    </div>
                )}
            </div>
        </div>
    );
}