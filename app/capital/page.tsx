"use client";
import React, { useEffect, useState } from "react";
import { ArrowLeft, Shield, TrendingUp, Lock, Cpu, Briefcase, ExternalLink, ArrowRight, Wallet } from "lucide-react"; 
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit"; 
import { useAccount } from "wagmi"; // Importante para detectar el cambio de wallet
import { useLang } from "@/lib/useLang"; 

const OFFICIAL_VAULTS = [
  {
    id: "eth-yield-max",
    name: "ETH YIELD MAXIMIZER",
    ticker: "ETH-Y",
    chain: "BASE",
    platform: "dHEDGE",
    apy: "35.5%",
    risk: "MODERATE",
    desc_en: "Algorithmic yield extraction on Base. Leverages Aave/Aerodrome for maximized ETH accumulation with delta-neutral hedging.",
    desc_es: "Extracción algorítmica de rendimiento en Base. Apalanca Aave/Aerodrome para máxima acumulación de ETH con cobertura delta-neutral.",
    link: "https://www.dhedge.org/" 
  },
  {
    id: "eth-max-arb",
    name: "ETH MAXIMIZER",
    ticker: "ETH-M",
    chain: "ARBITRUM",
    platform: "ENZYME",
    apy: "42.1%",
    risk: "AGGRESSIVE",
    desc_en: "Concentrated liquidity provision on Uniswap V3. Active range management to capture volatility fees.",
    desc_es: "Provisión de liquidez concentrada en Uniswap V3. Gestión activa de rangos para capturar comisiones de volatilidad.",
    link: "https://enzyme.finance/" 
  }
];

export default function CapitalPage() {
  const { lang } = useLang();
  const { address, isConnected } = useAccount(); // Detectamos la wallet activa
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const t = {
    en: {
        nav_back: "RETURN TO TERMINAL",
        badge_title: "CAPITAL MANAGEMENT",
        live: "LIVE FEED",
        hero_pre: "INSTITUTIONAL DEFI ARCHITECTURE",
        hero_title: "CAPITAL MANAGEMENT",
        hero_desc: "Gran Everest Capital builds automated, high-performance financial vehicles. We engineer yield, not chase it.",
        stats_aum: "AUM",
        stats_yield: "AVG. NET APY",
        section_thesis: "THE THESIS",
        thesis_1_title: "ALGORITHMIC PRECISION",
        thesis_1_desc: "Removing human error. Strategies execute based on strict quantitative parameters.",
        thesis_2_title: "RISK ARCHITECTURE",
        thesis_2_desc: "Capital preservation is paramount. We utilize delta-neutral structures.",
        thesis_3_title: "TRANSPARENT CUSTODY",
        thesis_3_desc: "Non-custodial by design. You retain ownership. Verifiable on-chain 24/7.",
        section_vaults: "ACTIVE VEHICLES",
        cta_access: "ACCESS VAULT",
        footer_rights: "ALL RIGHTS RESERVED",
        auth_required: "AUTHENTICATION REQUIRED",
        auth_desc: "Connect your authorized wallet to access management portals.",
        wallet_label: "AUTHENTICATE WALLET"
    },
    es: {
        nav_back: "VOLVER A TERMINAL",
        badge_title: "GESTIÓN DE CAPITAL",
        live: "FEED EN VIVO",
        hero_pre: "ARQUITECTURA DEFI INSTITUCIONAL",
        hero_title: "GESTIÓN DE CAPITAL",
        hero_desc: "Gran Everest Capital construye vehículos financieros automatizados. Diseñamos el rendimiento, no lo perseguimos.",
        stats_aum: "AUM",
        stats_yield: "APY NETO PROM.",
        section_thesis: "LA TESIS",
        thesis_1_title: "PRECISIÓN ALGORÍTMICA",
        thesis_1_desc: "Eliminando el error humano. Las estrategias se ejecutan bajo parámetros estrictos.",
        thesis_2_title: "ARQUITECTURA DE RIESGO",
        thesis_2_desc: "Preservación de capital. Utilizamos estructuras delta-neutrales.",
        thesis_3_title: "CUSTODIA TRANSPARENTE",
        thesis_3_desc: "No custodia por diseño. Usted retiene la propiedad. Verificable on-chain 24/7.",
        section_vaults: "VEHÍCULOS ACTIVOS",
        cta_access: "ACCEDER BÓVEDA",
        footer_rights: "TODOS LOS DERECHOS RESERVADOS",
        auth_required: "AUTENTICACIÓN REQUERIDA",
        auth_desc: "Conecta tu billetera autorizada para acceder a los portales de gestión.",
        wallet_label: "AUTENTICAR BILLETERA"
    }
  };

  const text = t[lang as keyof typeof t];

  if (!mounted) return null;

  // Pantalla de bloqueo si no hay wallet conectada (Evita que vean datos de otra wallet)
  if (!isConnected) {
    return (
      <main className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans flex flex-col items-center justify-center relative overflow-hidden">
        <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" 
             style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }}>
        </div>
        <div className="z-10 bg-[#0a0a0a] border border-white/10 p-12 rounded-sm text-center max-w-lg w-full shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <Lock size={48} className="mx-auto text-orange-500 mb-6 animate-pulse"/>
            <h1 className="text-2xl font-bold text-white uppercase tracking-widest mb-2">{text.auth_required}</h1>
            <p className="text-gray-500 text-xs font-mono mb-8">{text.auth_desc}</p>
            <div className="flex justify-center scale-110"><ConnectButton label={text.wallet_label} /></div>
            <Link href="/" className="mt-12 block text-xs font-mono text-gray-500 hover:text-white transition uppercase underline decoration-orange-500/50 underline-offset-4">{text.nav_back}</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans selection:bg-orange-500/30 pb-20 relative">
      
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }}>
      </div>

      {/* NAVBAR UNIFICADO (Top-0, Z-100, Solid) */}
      <nav className="fixed w-full top-0 z-[100] border-b border-white/10 bg-[#050505]">
        <div className="max-w-[1920px] mx-auto px-6 h-16 flex items-center justify-between">
          
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-white transition uppercase font-mono text-xs tracking-widest group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform"/> {text.nav_back}
          </Link>
          
          <div className="flex items-center gap-4">
             <div className="hidden md:flex text-[10px] font-mono text-orange-500 items-center gap-2 px-3 py-1 border border-orange-500/30 rounded-sm bg-orange-500/5">
                <Briefcase size={12}/> {text.badge_title}
             </div>

             <div className="text-[10px] font-mono text-emerald-500 flex items-center gap-2 px-3 py-1 border border-emerald-500/30 rounded-sm bg-emerald-500/5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> {text.live}
             </div>

             <div className="scale-90">
                <ConnectButton showBalance={false} chainStatus="icon" accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }} />
             </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 pt-32 px-6 md:px-12 max-w-[1600px] mx-auto">
        
        {/* HERO SECTION */}
        <section className="mb-32 border-l-2 border-orange-500 pl-8 md:pl-12">
            <span className="text-orange-500 font-mono text-[10px] tracking-[0.2em] mb-4 block">
                // {text.hero_pre} // ACTIVE SESSION: {address?.substring(0,6)}...{address?.substring(38)}
            </span>
            <h1 className="text-5xl md:text-8xl font-bold text-white tracking-tighter leading-[0.9] mb-8 uppercase max-w-4xl">
                {text.hero_title}
            </h1>
            <p className="text-lg md:text-xl text-gray-500 font-light max-w-2xl leading-relaxed font-mono">
                {text.hero_desc}
            </p>
        </section>

        {/* METRICS STRIP */}
        <section className="mb-32 grid grid-cols-2 md:grid-cols-4 gap-8 border-y border-white/10 py-12">
            <div>
                <div className="text-[10px] text-gray-600 font-mono uppercase tracking-widest mb-2">{text.stats_aum}</div>
                <div className="text-4xl font-bold text-white tracking-tighter">$2.5M+</div>
            </div>
            <div>
                <div className="text-[10px] text-gray-600 font-mono uppercase tracking-widest mb-2">{text.stats_yield}</div>
                <div className="text-4xl font-bold text-orange-500 tracking-tighter">~38.2%</div>
            </div>
        </section>

        {/* THESIS */}
        <section className="mb-32">
            <h2 className="text-sm font-mono text-orange-500 uppercase tracking-widest mb-12 flex items-center gap-4">
                <span className="w-4 h-4 bg-orange-500 rounded-sm"></span> {text.section_thesis}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { title: text.thesis_1_title, desc: text.thesis_1_desc, icon: Cpu },
                    { title: text.thesis_2_title, desc: text.thesis_2_desc, icon: Shield },
                    { title: text.thesis_3_title, desc: text.thesis_3_desc, icon: Lock },
                ].map((item, i) => (
                    <div key={i} className="bg-[#0a0a0a] border border-white/10 p-8 hover:border-orange-500/50 transition-all group">
                        <item.icon className="text-gray-600 mb-6 group-hover:text-orange-500 transition-colors" size={24}/>
                        <h3 className="text-lg font-bold text-white mb-3 uppercase">{item.title}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </div>
        </section>

        {/* VAULTS LIST */}
        <section>
            <h2 className="text-4xl font-bold text-white uppercase tracking-tighter mb-12">{text.section_vaults}</h2>
            <div className="space-y-4">
                {OFFICIAL_VAULTS.map((vault) => (
                    <div key={vault.id} className="group relative bg-[#080808] border border-white/10 hover:border-orange-500 transition-all overflow-hidden">
                        <div className="absolute inset-0 bg-orange-500/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
                        
                        <div className="relative p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                            <div className="flex-1">
                                <div className="flex gap-2 mb-3">
                                    <span className="text-[10px] font-bold bg-orange-500 text-black px-2 py-0.5 rounded-sm uppercase">{vault.chain}</span>
                                    <span className="text-[10px] font-bold border border-white/20 text-gray-400 px-2 py-0.5 rounded-sm uppercase">{vault.platform}</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white uppercase mb-2 group-hover:text-orange-500 transition-colors">
                                    {vault.name}
                                </h3>
                                <p className="text-gray-500 text-sm max-w-lg">
                                    {lang === 'en' ? vault.desc_en : vault.desc_es}
                                </p>
                            </div>

                            <div className="flex items-center gap-12">
                                <div>
                                    <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">APY</div>
                                    <div className="text-xl font-mono font-bold text-emerald-500">{vault.apy}</div>
                                </div>
                                <a href={vault.link} target="_blank" rel="noopener noreferrer" className="h-10 px-6 border border-white/20 flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-orange-500 hover:text-black hover:border-orange-500 transition-all">
                                    {text.cta_access} <ExternalLink size={14}/>
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        <footer className="mt-40 border-t border-white/10 pt-8 text-center md:text-left flex flex-col md:flex-row justify-between text-[10px] text-gray-600 font-mono uppercase">
            <div>© 2026 GRAN EVEREST CAPITAL. {text.footer_rights}.</div>
            <div className="mt-4 md:mt-0 space-x-6">
                <span className="hover:text-white cursor-pointer transition">Twitter</span>
                <span className="hover:text-white cursor-pointer transition">Email</span>
            </div>
        </footer>

      </div>
    </main>
  );
}