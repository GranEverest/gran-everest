"use client";
import React from "react";
import Link from "next/link";
import { Bitcoin, Layers, ArrowRight, Microscope } from "lucide-react";

const ASSETS = [
  {
    id: "btc",
    title: "BITCOIN INTELLIGENCE",
    subtitle: "ON-CHAIN & MACRO",
    desc: "Fee markets, UTXO age analysis, Miner economics, and Institutional ETF flows.",
    icon: Bitcoin,
    path: "/quant/bitcoin",
    color: "text-orange-500",
    bg: "bg-orange-500/5",
    border: "border-orange-500/20 hover:border-orange-500"
  },
  {
    id: "eth",
    title: "ETHEREUM INTELLIGENCE",
    subtitle: "STAKING & SCALING",
    desc: "Validator metrics, Liquid Staking derivatives (LSDs), L2 adoption wars, and Gas dynamics.",
    icon: Layers,
    path: "/quant/ethereum",
    color: "text-purple-500",
    bg: "bg-purple-500/5",
    border: "border-purple-500/20 hover:border-purple-500"
  }
];

export default function QuantMainHub() {
  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 pt-12">
      
      {/* HERO SECTION */}
      <div className="mb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/5 text-blue-400 text-xs font-mono font-bold mb-6">
            <Microscope size={12}/> QUANTITATIVE LAB
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter mb-4">
            CHOOSE YOUR <span className="text-blue-500">VECTOR</span>
        </h1>
        <p className="text-gray-500 font-mono text-xs tracking-widest max-w-xl mx-auto">
            ACCESS INSTITUTIONAL-GRADE ON-CHAIN DATA FEEDS. SELECT AN ASSET TO INITIALIZE THE DASHBOARD.
        </p>
      </div>

      {/* ASSET SELECTION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {ASSETS.map((asset) => (
          <Link key={asset.id} href={asset.path} className="h-full">
            {/* CORRECCIÓN VISUAL:
                1. h-full: Ocupa toda la altura disponible de la grilla.
                2. flex-col: Organiza el contenido verticalmente.
                3. flex-grow (en el div del medio): Empuja el footer hacia abajo.
            */}
            <div className={`group relative h-full min-h-[340px] bg-[#0a0a0a] border ${asset.border} p-10 rounded-sm transition-all duration-500 hover:bg-[#0f0f0f] flex flex-col`}>
                
                {/* Background Glow */}
                <div className={`absolute inset-0 ${asset.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                {/* CONTENIDO SUPERIOR (Se expande) */}
                <div className="relative z-10 flex-grow">
                    <div className={`w-16 h-16 flex items-center justify-center rounded-sm ${asset.bg} ${asset.color} mb-6 border border-white/5`}>
                        <asset.icon size={32} />
                    </div>
                    <div className="text-xs font-mono text-gray-500 tracking-widest mb-1">{asset.subtitle}</div>
                    <h3 className="text-3xl font-bold text-white mb-4 group-hover:tracking-wide transition-all">
                        {asset.title}
                    </h3>
                    <p className="text-xs text-gray-400 font-mono leading-relaxed">
                        {asset.desc}
                    </p>
                </div>

                {/* FOOTER (Siempre pegado abajo) */}
                <div className="relative z-10 mt-8 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-gray-500 group-hover:text-white transition-colors uppercase tracking-widest">
                        ENTER TERMINAL <ArrowRight size={12} className="group-hover:translate-x-2 transition-transform"/>
                    </div>
                </div>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}