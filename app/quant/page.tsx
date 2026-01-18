"use client";
import React from "react";
import Link from "next/link";
import { Bitcoin, Layers, ArrowRight, Microscope } from "lucide-react";
import { useLang } from "@/lib/useLang"; // Importamos el hook

export default function QuantMainHub() {
  const { lang } = useLang();

  // DICCIONARIO DE CONTENIDO
  const content = {
    en: {
        badge: "QUANTITATIVE LAB",
        heroTitle: "CHOOSE YOUR",
        heroVector: "VECTOR",
        heroDesc: "ACCESS INSTITUTIONAL-GRADE ON-CHAIN DATA FEEDS. SELECT AN ASSET TO INITIALIZE THE DASHBOARD.",
        enter: "ENTER TERMINAL",
        assets: [
            {
                id: "btc",
                title: "BITCOIN INTELLIGENCE",
                subtitle: "ON-CHAIN & MACRO",
                desc: "Fee markets, UTXO age analysis, Miner economics, and Institutional ETF flows.",
            },
            {
                id: "eth",
                title: "ETHEREUM INTELLIGENCE",
                subtitle: "STAKING & SCALING",
                desc: "Validator metrics, Liquid Staking derivatives (LSDs), L2 adoption wars, and Gas dynamics.",
            }
        ]
    },
    es: {
        badge: "LABORATORIO CUANTITATIVO",
        heroTitle: "ELIGE TU",
        heroVector: "VECTOR",
        heroDesc: "ACCEDE A DATOS ON-CHAIN DE GRADO INSTITUCIONAL. SELECCIONA UN ACTIVO PARA INICIAR EL DASHBOARD.",
        enter: "ENTRAR A TERMINAL",
        assets: [
            {
                id: "btc",
                title: "INTELIGENCIA BITCOIN",
                subtitle: "ON-CHAIN Y MACRO",
                desc: "Mercados de fees, análisis UTXO, economía minera y flujos institucionales de ETFs.",
            },
            {
                id: "eth",
                title: "INTELIGENCIA ETHEREUM",
                subtitle: "STAKING Y ESCALADO",
                desc: "Métricas de validadores, Derivados de Liquid Staking (LSDs), guerras de L2 y dinámicas de Gas.",
            }
        ]
    }
  };

  const t = content[lang as keyof typeof content] || content.en;

  // Configuración estática (iconos y colores no cambian con el idioma)
  const styles = {
    btc: { icon: Bitcoin, path: "/quant/bitcoin", color: "text-orange-500", bg: "bg-orange-500/5", border: "border-orange-500/20 hover:border-orange-500" },
    eth: { icon: Layers, path: "/quant/ethereum", color: "text-purple-500", bg: "bg-purple-500/5", border: "border-purple-500/20 hover:border-purple-500" }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 pt-12">
      
      {/* HERO SECTION */}
      <div className="mb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/5 text-blue-400 text-xs font-mono font-bold mb-6">
            <Microscope size={12}/> {t.badge}
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter mb-4">
            {t.heroTitle} <span className="text-blue-500">{t.heroVector}</span>
        </h1>
        <p className="text-gray-500 font-mono text-xs tracking-widest max-w-xl mx-auto">
            {t.heroDesc}
        </p>
      </div>

      {/* ASSET SELECTION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {t.assets.map((asset) => {
            const style = styles[asset.id as keyof typeof styles];
            return (
              <Link key={asset.id} href={style.path} className="h-full">
                <div className={`group relative h-full min-h-[340px] bg-[#0a0a0a] border ${style.border} p-10 rounded-sm transition-all duration-500 hover:bg-[#0f0f0f] flex flex-col`}>
                    <div className={`absolute inset-0 ${style.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                    <div className="relative z-10 flex-grow">
                        <div className={`w-16 h-16 flex items-center justify-center rounded-sm ${style.bg} ${style.color} mb-6 border border-white/5`}>
                            <style.icon size={32} />
                        </div>
                        <div className="text-xs font-mono text-gray-500 tracking-widest mb-1">{asset.subtitle}</div>
                        <h3 className="text-3xl font-bold text-white mb-4 group-hover:tracking-wide transition-all">
                            {asset.title}
                        </h3>
                        <p className="text-xs text-gray-400 font-mono leading-relaxed">
                            {asset.desc}
                        </p>
                    </div>
                    <div className="relative z-10 mt-8 pt-6 border-t border-white/5">
                        <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-gray-500 group-hover:text-white transition-colors uppercase tracking-widest">
                            {t.enter} <ArrowRight size={12} className="group-hover:translate-x-2 transition-transform"/>
                        </div>
                    </div>
                </div>
              </Link>
            );
        })}
      </div>
    </div>
  );
}