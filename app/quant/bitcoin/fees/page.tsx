"use client";
import React, { useState, useEffect, useRef } from "react";
import { Activity, Hash, ExternalLink, Zap, Share2, Check } from "lucide-react";

// --- CONFIGURACIÓN DE CHARTS DE DUNE (BTC FEES) ---
// Agregamos un 'id' único para poder crear el link directo (anchor)
const FEE_CHARTS = [
    // --- ROW 1: MOVING AVERAGES & MACRO ---
    { id: "sat-vb-3d", title: "BTC SAT/VB INDEX (3-DAY MA)", url: "https://dune.com/embeds/4271242/7179836", span: "col-span-1" },
    { id: "sat-vb-7d", title: "BTC SAT/VB INDEX (7-DAY MA)", url: "https://dune.com/embeds/3681665/6192350", span: "col-span-1" },
    { id: "sat-vb-30d", title: "BTC SAT/VB INDEX (30-DAY MA)", url: "https://dune.com/embeds/3459137/5813368", span: "col-span-1" },
    { id: "daily-tx-vol", title: "DAILY TX VOL VS FEES", url: "https://dune.com/embeds/3811018/6409432", span: "col-span-1" },

    // --- ROW 2: FEE COMPOSITION ---
    { id: "fee-composition", title: "FEE COMPOSITION BY TX TYPE", url: "https://dune.com/embeds/3690841/6209293", span: "col-span-2" },
    { id: "median-fees", title: "MEDIAN TX FEES (14 DAYS)", url: "https://dune.com/embeds/3462176/5819026", span: "col-span-2" },

    // --- ROW 3: PROTOCOLS (RUNES / INSCRIPTIONS) ---
    { id: "runes-fee-share", title: "RUNES/INSCRIPTIONS (FEE SHARE %)", url: "https://dune.com/embeds/3730520/6467992", span: "col-span-2" },
    { id: "runes-tx-count", title: "RUNES/INSCRIPTIONS (TX COUNT %)", url: "https://dune.com/embeds/3730520/6274188", span: "col-span-2" },

    // --- ROW 4: DEEP DIVE ---
    { id: "fee-heatmap", title: "FEE RATES BY HOUR HEATMAP", url: "https://dune.com/embeds/3798451/6386252", span: "col-span-2" },
    { id: "fee-percentile", title: "TX TYPE VS FEE PERCENTILE", url: "https://dune.com/embeds/3798451/6386257", span: "col-span-2" },
];

export default function BtcFeesPage() {
    return (
        <div className="space-y-6">
            {/* Header de la Sección */}
            <h3 className="text-sm font-mono text-red-500 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-red-500/20 pb-2 w-fit">
                <Zap size={16}/> BTC FEE MARKET ANALYTICS
            </h3>
            
            {/* Grid de Gráficos */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-20">
                {FEE_CHARTS.map((chart, i) => (
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

// --- COMPONENTE LAZY LOAD CON SHARE & DARK MODE ---
function LazyDuneChart({ id, title, url, span }: { id: string, title: string, url: string, span: string }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Intersection Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
            { rootMargin: "200px" }
        );
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Función para copiar el link directo al gráfico
    const handleShare = () => {
        // Construye el link: https://tudominio.com/quant/bitcoin/fees#fee-heatmap
        const deepLink = `${window.location.origin}${window.location.pathname}#${id}`;
        
        navigator.clipboard.writeText(deepLink).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000); // Reset después de 2 seg
        });
    };

    return (
        <div 
            id={id} 
            // scroll-mt-32 asegura que el header fijo no tape el gráfico al hacer scroll
            className={`bg-[#0a0a0a] border border-white/10 p-1 rounded-sm h-[350px] flex flex-col ${span} scroll-mt-32`}
        >
            {/* Barra superior del chart */}
            <div className="p-3 border-b border-white/5 flex justify-between items-center bg-[#111] shrink-0">
                
                {/* Título */}
                <span className="text-[10px] font-mono font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2 truncate">
                    <Hash size={10} className="text-red-500"/> {title}
                </span>

                {/* Acciones (Share + Link externo) */}
                <div className="flex items-center gap-3">
                    
                    {/* Botón Share */}
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

                    {/* Separador */}
                    <div className="h-3 w-[1px] bg-white/10"></div>

                    {/* Link a Dune original */}
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-white" title="Open in Dune">
                        <ExternalLink size={12}/>
                    </a>
                </div>
            </div>
            
            {/* Contenedor del Iframe */}
            <div ref={containerRef} className="relative flex-1 w-full bg-black overflow-hidden group">
                {isVisible ? (
                    <iframe 
                        src={url} 
                        title={title}
                        className="absolute inset-0 w-full h-full border-none transition-opacity duration-700 opacity-0 animate-in fade-in"
                        // FILTRO MEJORADO: Invertimos, rotamos, pero saturamos un poco más para recuperar viveza
                        style={{ 
                            opacity: 1, 
                            filter: 'invert(93%) hue-rotate(180deg) contrast(85%) saturate(150%)', 
                            mixBlendMode: 'normal' 
                        }}
                        loading="lazy"
                    ></iframe>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
                        <Activity className="text-red-500/20 animate-pulse" size={24} />
                        <span className="text-[9px] font-mono text-gray-700 uppercase tracking-widest">Loading Feed...</span>
                    </div>
                )}
            </div>
        </div>
    );
}