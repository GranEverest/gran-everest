"use client";
import { useEffect, useState } from "react";
import { getTopStrategies } from "@/lib/api";
import { ArrowUpRight, Globe, Cpu, Landmark, Droplets, Briefcase, BarChart3, Crown, ArrowUpDown, Layers, ChevronLeft, ChevronRight, LayoutDashboard, Wallet, Coins, Search, ChevronDown, Network, ShieldAlert, Server, Microscope } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/useLang"; 
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const customStyles = `
  .bg-grid-pattern {
    background-image: linear-gradient(to right, #222 1px, transparent 1px),
                      linear-gradient(to bottom, #222 1px, transparent 1px);
    background-size: 40px 40px;
  }
  .appearance-none {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
  }
`;

const t = {
  en: {
    hero_badge: "SYSTEM V.9.9 // ANALYTICS ENGINE",
    hero_title: "DEFI INTELLIGENCE",
    hero_subtitle: "TERMINAL",
    search_token_placeholder: "FILTER ASSET (E.G. ETH)...",
    search_proto_placeholder: "FILTER PROTOCOL (E.G. AAVE)...",
    filter_all: "ALL SYSTEMS",
    filter_vaults: "MANAGED VAULTS",
    filter_lending: "LENDING",
    filter_farms: "LIQUIDITY",
    filter_stable: "STABLES",
    net_title: "NETWORKS:",
    net_all: "GLOBAL",
    col_asset: "STRATEGY",
    col_type: "SECTOR",
    col_risk: "RISK",
    col_chain: "CHAIN", 
    col_tvl: "TVL",
    col_apy: "APY", 
    col_roi: "EST. RETURN", 
    col_act: "ANALYZE",
    loading: "ACCESSING GLOBAL DATA FEED...", 
    no_results: "NO SIGNALS MATCHING CRITERIA.",
    page_prev: "PREV",
    page_next: "NEXT",
    page_of: "OF"
  },
  es: {
    hero_badge: "SISTEMA V.9.9 // MOTOR ANALITICO",
    hero_title: "INTELIGENCIA DEFI",
    hero_subtitle: "TERMINAL",
    search_token_placeholder: "FILTRAR ACTIVO (EJ. ETH)...",
    search_proto_placeholder: "FILTRAR PROTOCOLO (EJ. AAVE)...",
    filter_all: "TODOS",
    filter_vaults: "GESTORES / VAULTS",
    filter_lending: "PRESTAMOS",
    filter_farms: "LIQUIDEZ",
    filter_stable: "ESTABLES",
    net_title: "REDES:",
    net_all: "GLOBAL",
    col_asset: "ESTRATEGIA",
    col_type: "SECTOR",
    col_risk: "RIESGO",
    col_chain: "RED", 
    col_tvl: "TVL",
    col_apy: "APY", 
    col_roi: "RETORNO EST.", 
    col_act: "ANALIZAR",
    loading: "ACCEDIENDO AL FEED DE DATOS GLOBAL...",
    no_results: "NO SE ENCONTRARON COINCIDENCIAS.",
    page_prev: "ANT",
    page_next: "SIG",
    page_of: "DE"
  }
};

const THEME_COLORS: any = {
  ALL: { border: "border-orange-500", bg: "bg-orange-500/10", text: "text-orange-500" },
  VAULTS: { border: "border-cyan-400", bg: "bg-cyan-400/10", text: "text-cyan-400" },
  LIQUIDITY: { border: "border-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-500" },
  STABLES: { border: "border-blue-500", bg: "bg-blue-500/10", text: "text-blue-500" },
  LENDING: { border: "border-purple-500", bg: "bg-purple-500/10", text: "text-purple-500" }
};

const CHAINS = ["ALL", "Ethereum", "Base", "Arbitrum", "Optimism", "BSC", "Polygon", "Avalanche", "Solana"];
const ITEMS_PER_PAGE = 20;

type TimeView = 'daily' | 'monthly' | 'yearly';

export default function Home() {
  const router = useRouter();
  const { lang, setLang } = useLang(); 

  const [pools, setPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchToken, setSearchToken] = useState("");
  const [searchProtocol, setSearchProtocol] = useState("");
  
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [activeChain, setActiveChain] = useState("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'tvlUsd', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);

  const [timeView, setTimeView] = useState<TimeView>('yearly');

  const activeThemeKey = activeFilter === "POOLS" ? "LIQUIDITY" : activeFilter;
  const theme = THEME_COLORS[activeThemeKey] || THEME_COLORS.ALL;
  const accentColor = activeFilter === "ALL" ? THEME_COLORS.ALL.text : theme.text;
  const accentBg = activeFilter === "ALL" ? "bg-orange-500" : theme.text.replace('text-','bg-');

  const text = t[lang];

  useEffect(() => {
    getTopStrategies().then((data) => {
      setPools(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchToken, searchProtocol, activeFilter, activeChain]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ key, direction });
  };

  const handleRowClick = (poolId: string) => {
    router.push(`/strategy/${poolId}`);
  };

  const filteredAndSortedPools = pools.filter(pool => {
      const matchesToken = pool.symbol.toLowerCase().includes(searchToken.toLowerCase());
      const matchesProtocol = pool.project.toLowerCase().includes(searchProtocol.toLowerCase());
      
      let matchesCategory = true;
      if (activeFilter === "VAULTS") matchesCategory = pool.type === "VAULT";
      if (activeFilter === "LENDING") matchesCategory = pool.type === "LENDING";
      if (activeFilter === "POOLS") matchesCategory = pool.type === "LIQUIDITY";
      if (activeFilter === "STABLES") matchesCategory = pool.symbol.includes("USD") || pool.symbol.includes("DAI") || pool.symbol.includes("USDT");
      
      let matchesChain = true;
      if (activeChain !== "ALL") {
          const apiChainName = activeChain === "BSC" ? "bsc" : activeChain.toLowerCase();
          matchesChain = pool.chain.toLowerCase() === apiChainName;
      }
      return matchesToken && matchesProtocol && matchesCategory && matchesChain;
    }).sort((a, b) => {
      let keyToUse = sortConfig.key;
      if (sortConfig.key === 'timeview') {
          keyToUse = 'apy'; 
      }
      const valA = a[keyToUse];
      const valB = b[keyToUse];
      return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
    });

  const totalPages = Math.ceil(filteredAndSortedPools.length / ITEMS_PER_PAGE);
  const currentPools = filteredAndSortedPools.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      document.getElementById('table-top')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans selection:bg-white/20 pb-32 transition-colors duration-500 relative">
      <style jsx global>{customStyles}</style>
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20 bg-grid-pattern"></div>

      {/* NAVBAR */}
      <nav className="fixed w-full top-8 z-40 border-b border-white/10 bg-[#050505]/90 backdrop-blur-md transition-all duration-300">
        <div className="w-full px-6 h-20 flex items-center justify-between">
          
          {/* LOGO */}
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 bg-white text-black flex items-center justify-center font-bold text-lg tracking-tighter rounded-sm transition-all duration-500 shadow-[0_0_15px_rgba(255,255,255,0.1)]`}>GE</div>
            <span className="text-xs md:text-sm font-mono tracking-[0.2em] text-gray-400 hidden md:block">GRAN EVEREST</span>
          </div>
          
          {/* BOTONES DE NAVEGACIÓN INTEGRADOS */}
          <div className="flex items-center gap-6">
            
            {/* 1. MARKET PULSE */}
            <Link href="/market" className="flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-white transition uppercase font-bold group">
                <LayoutDashboard size={14} className="group-hover:text-orange-500 transition-colors"/>
                MARKET PULSE
            </Link>
            
            {/* 2. PROTOCOLS */}
            <Link href="/protocols" className="flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-white transition uppercase font-bold group">
                <Server size={14} className="group-hover:text-cyan-500 transition-colors"/>
                PROTOCOLS
            </Link>

            {/* 3. CAPITAL */}
            <Link href="/capital" className="flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-white transition uppercase font-bold group">
                <BarChart3 size={14} className="group-hover:text-purple-500 transition-colors"/>
                CAPITAL
            </Link>

            {/* 4. QUANT (NUEVO) */}
            <Link href="/quant" className="flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-white transition uppercase font-bold group">
                <Microscope size={14} className="group-hover:text-blue-500 transition-colors"/>
                QUANT
            </Link>

            {/* 5. PORTFOLIO */}
            <Link href="/portfolio" className="flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-white transition uppercase font-bold group">
                <Wallet size={14} className="group-hover:text-emerald-500 transition-colors"/>
                PORTFOLIO
            </Link>
            
            {/* SEPARADOR & UTILIDADES */}
            <div className="h-4 w-px bg-white/10"></div>
            
            <button onClick={() => setLang(lang === 'en' ? 'es' : 'en')} className="flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-white transition uppercase">
              <Globe size={14}/> {lang}
            </button>
            
            <div className="font-mono text-xs">
              <ConnectButton showBalance={false} chainStatus="icon" accountStatus={{ smallScreen: 'avatar', largeScreen: 'full', }} />
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 w-full px-4 md:px-8 pt-48 max-w-[1920px] mx-auto">
        <div className="mb-20">
          <div className={`flex items-center gap-3 mb-6 font-mono text-xs tracking-widest transition-colors duration-500 ${accentColor}`}>
            <div className={`w-2 h-2 animate-pulse ${accentBg}`}></div>
            {text.hero_badge}
          </div>
          <h1 className="text-6xl md:text-9xl font-bold tracking-tighter text-white leading-[0.9] mb-8 uppercase transition-all duration-500">
            {text.hero_title} <br/><span className={`stroke-text transition-colors duration-500 opacity-50 ${accentColor}`}>{text.hero_subtitle}</span>
          </h1>
        </div>

        {/* --- SEARCH & FILTERS --- */}
        <div className="mb-8 space-y-6 bg-[#0a0a0a] border border-white/10 p-6 rounded-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative group">
                <div className={`absolute -inset-0.5 opacity-0 group-hover:opacity-100 transition duration-500 blur-sm ${accentBg}/20`}></div>
                <div className={`relative flex items-center bg-[#111] border p-4 transition-colors duration-300 border-white/10 focus-within:border-white/30 h-16`}>
                <Coins className={`mr-4 transition-colors duration-300 text-gray-500 group-hover:text-white`} size={20} />
                <input type="text" placeholder={text.search_token_placeholder} className="w-full bg-transparent border-none focus:ring-0 text-white text-lg font-mono uppercase placeholder:text-zinc-700 outline-none" onChange={(e) => setSearchToken(e.target.value)} value={searchToken}/>
                </div>
            </div>
            <div className="relative group">
                <div className={`absolute -inset-0.5 opacity-0 group-hover:opacity-100 transition duration-500 blur-sm ${accentBg}/20`}></div>
                <div className={`relative flex items-center bg-[#111] border p-4 transition-colors duration-300 border-white/10 focus-within:border-white/30 h-16`}>
                <Layers className={`mr-4 transition-colors duration-300 text-gray-500 group-hover:text-white`} size={20} />
                <input type="text" placeholder={text.search_proto_placeholder} className="w-full bg-transparent border-none focus:ring-0 text-white text-lg font-mono uppercase placeholder:text-zinc-700 outline-none" onChange={(e) => setSearchProtocol(e.target.value)} value={searchProtocol}/>
                </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 border-b border-white/5 pb-6">
            {[{ id: "ALL", label: text.filter_all, icon: Layers }, { id: "LENDING", label: text.filter_lending, icon: Landmark }, { id: "POOLS", label: text.filter_farms, icon: Droplets }, { id: "STABLES", label: text.filter_stable, icon: BarChart3 }, { id: "VAULTS", label: text.filter_vaults, icon: Briefcase }].map((cat) => {
              const isActive = activeFilter === cat.id;
              const catKey = cat.id === "POOLS" ? "LIQUIDITY" : cat.id;
              const btnTheme = THEME_COLORS[catKey] || THEME_COLORS.ALL;
              const iconColor = isActive ? (cat.id === 'ALL' ? THEME_COLORS.ALL.text : btnTheme.text) : 'text-gray-500';
              return (
                <button key={cat.id} onClick={() => setActiveFilter(cat.id)} className={`px-5 py-3 text-xs font-mono font-bold uppercase tracking-widest border transition-all duration-300 rounded-sm flex items-center gap-2 ${isActive ? `${btnTheme.border} ${btnTheme.bg} text-white shadow-[0_0_15px_rgba(0,0,0,0.5)]` : `bg-transparent text-gray-500 border-white/10 hover:border-white/30 hover:text-white`}`}>
                  {cat.icon && <cat.icon size={14} className={iconColor}/>}{cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
            <span className="text-xs font-mono text-gray-600 uppercase tracking-widest shrink-0 flex items-center gap-2"><Globe size={12}/> {text.net_title}</span>
            <div className="flex gap-2">
                {CHAINS.map(chainName => {
                    const isActive = activeChain === chainName;
                    return (
                      <button 
                        key={chainName} onClick={() => setActiveChain(chainName)} 
                        className={`px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest border transition-all rounded-sm whitespace-nowrap ${isActive ? `border-white bg-white text-black` : `border-white/10 bg-transparent text-gray-500 hover:text-white hover:border-white/30`}`}
                      >{chainName === "ALL" ? text.net_all : chainName}</button>
                    )
                })}
            </div>
          </div>
        </div>

        <div id="table-top" className="border-t border-white/20 min-h-[600px] mt-12">
          
          {/* --- TABLE HEADER (RESTAURADO "ANALYZE") --- */}
          <div className="grid grid-cols-12 gap-4 py-6 text-xs font-mono text-gray-600 uppercase tracking-widest border-b border-white/10 select-none items-center">
            
            {/* 1. ASSET (3 Cols Desktop, 4 Mobile) */}
            <div className="col-span-4 md:col-span-3 pl-2">{text.col_asset}</div>
            
            {/* 2. SECTOR (1 Col) - Center - Oculto en Mobile para dar espacio a Asset */}
            <div className="hidden md:block col-span-1 text-center">{text.col_type}</div>

            {/* 3. CHAIN (1 Col) - Center */}
            <div className="col-span-1 text-center flex justify-center items-center gap-1">{text.col_chain}</div>

            {/* 4. RISK (1 Col) - Center */}
            <div className="col-span-1 text-center">{text.col_risk}</div>

            {/* 5. TVL (2 Cols) - Center */}
            <div className={`col-span-2 text-center cursor-pointer hover:text-white transition-colors`} onClick={() => handleSort('tvlUsd')}>
                {text.col_tvl} <ArrowUpDown size={10} className="inline ml-1"/>
            </div>

            {/* 6. APY (1 Col) - Center (REDUCIDO PARA DAR ESPACIO) */}
            <div className="col-span-1 text-center text-emerald-500 font-bold cursor-pointer hover:text-white" onClick={() => handleSort('apy')}>
                {text.col_apy} <ArrowUpDown size={10} className="inline ml-1"/>
            </div>
            
            {/* 7. ROI SELECTOR (2 Cols) - Right */}
            <div className="col-span-2 flex justify-end pr-4">
                <div className="relative group pb-2 pt-2 -my-2">
                    <div className="flex items-center cursor-pointer hover:text-white text-gray-400 font-bold gap-2 bg-white/5 px-3 py-1.5 rounded-sm border border-white/10 hover:border-white/30 transition">
                         <span>{text.col_roi} ({timeView === 'daily' ? '1D' : timeView === 'monthly' ? '30D' : '1Y'})</span>
                         <ChevronDown size={10} />
                    </div>
                    <div className="absolute right-0 top-[calc(100%-8px)] pt-2 w-32 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50">
                        <div className="bg-[#111] border border-white/20 rounded-sm shadow-xl flex flex-col p-1">
                            <button onClick={() => setTimeView('daily')} className="px-3 py-2 text-[10px] hover:bg-white/10 text-left text-gray-300 hover:text-white transition flex justify-between">DAILY <span>(1D)</span></button>
                            <button onClick={() => setTimeView('monthly')} className="px-3 py-2 text-[10px] hover:bg-white/10 text-left text-gray-300 hover:text-white transition flex justify-between">MONTHLY <span>(30D)</span></button>
                            <button onClick={() => setTimeView('yearly')} className="px-3 py-2 text-[10px] hover:bg-white/10 text-left text-gray-300 hover:text-white transition flex justify-between">YEARLY <span>(1Y)</span></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 8. ANALYZE (1 Col) - RESTAURADO! */}
            <div className="col-span-1 text-right pr-2">{text.col_act}</div>
          </div>

          <div className="">
            {loading ? (
              <div className={`py-32 text-center flex flex-col items-center gap-4 font-mono animate-pulse ${THEME_COLORS.ALL.text}`}><Cpu size={48}/><span className="tracking-widest">{text.loading}</span></div>
            ) : currentPools.length > 0 ? (
              <>
                {currentPools.map((pool, i) => {
                  const isVault = pool.type === "VAULT";
                  const isLending = pool.type === "LENDING";
                  const isStable = activeFilter === "STABLES" || pool.symbol.includes("USD");
                  let rowTheme = THEME_COLORS.LIQUIDITY;
                  if (isVault) rowTheme = THEME_COLORS.VAULTS;
                  else if (isLending) rowTheme = THEME_COLORS.LENDING;
                  else if (isStable && activeFilter === "STABLES") rowTheme = THEME_COLORS.STABLES;

                  let roiPercent = 0;
                  if (timeView === 'daily') roiPercent = pool.apy / 365;
                  if (timeView === 'monthly') roiPercent = pool.apy / 12;
                  if (timeView === 'yearly') roiPercent = pool.apy;

                  const displayROI = roiPercent.toFixed(2) + "%";
                  const estEarnings = (1000 * (roiPercent/100)).toLocaleString('en-US', {style: 'currency', currency: 'USD'});

                  return (
                    <div key={i} onClick={() => handleRowClick(pool.pool)} className="grid grid-cols-12 gap-4 py-5 items-center border-b border-white/5 hover:bg-white/[0.05] transition duration-200 group cursor-pointer text-sm">
                      
                      {/* 1. ASSET (3 Cols) */}
                      <div className="col-span-4 md:col-span-3 flex items-center gap-5 pl-2">
                        <div className={`w-9 h-9 border flex items-center justify-center font-bold text-[10px] transition rounded-sm shrink-0 text-white ${rowTheme.border} ${rowTheme.bg}`}>{pool.displaySymbol.substring(0, 2)}</div>
                        <div className="overflow-hidden">
                          <div className={`text-base font-bold transition uppercase tracking-tight truncate flex items-center gap-2 text-white`}>{pool.displaySymbol}{pool.isOfficial && <Crown size={14} className="text-orange-500 animate-pulse ml-1" />}</div>
                          <div className="text-[10px] font-mono font-bold text-gray-500 uppercase mt-1 truncate tracking-wider">{pool.project}</div>
                        </div>
                      </div>

                      {/* 2. SECTOR (1 Col) - Center */}
                      <div className="hidden md:flex col-span-1 justify-center items-center gap-2">
                          <span className={`text-[10px] font-mono uppercase ${rowTheme.text}`}>{pool.type}</span>
                      </div>

                      {/* 3. CHAIN (1 Col) - Center */}
                      <div className="col-span-1 flex justify-center items-center gap-2 text-[10px] font-mono font-bold text-gray-400 uppercase">
                          <Network size={12}/> {pool.chain}
                      </div>
                      
                      {/* 4. RISK (1 Col) - Center */}
                      <div className="col-span-1 flex justify-center">
                        <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-sm tracking-wider flex items-center gap-1 ${pool.risk === 'LOW' ? 'border-emerald-900 text-emerald-600 bg-emerald-900/10' : pool.risk === 'MED' ? 'border-yellow-900 text-yellow-600 bg-yellow-900/10' : 'border-red-900 text-red-600 bg-red-900/10'}`}>
                            {pool.risk === 'HIGH' && <ShieldAlert size={10}/>} {pool.risk}
                        </span>
                      </div>

                      {/* 5. TVL (2 Cols) - Center */}
                      <div className="col-span-2 text-center text-white font-mono tracking-tighter text-sm">
                        ${(pool.tvlUsd / 1000000).toFixed(1)}M
                      </div>

                      {/* 6. APY (1 Col) - Center (REDUCIDO) */}
                      <div className="col-span-1 text-center font-mono tracking-tighter text-emerald-400 font-bold text-base shadow-emerald-500/10 drop-shadow-sm">
                        {pool.apy.toFixed(2)}%
                      </div>

                      {/* 7. DYNAMIC ROI (2 Cols) - Right */}
                      <div className={`col-span-2 flex flex-col items-end pr-4`}>
                        <span className={`font-mono font-bold text-white`}>+{displayROI}</span>
                        <span className="text-[9px] text-gray-600 font-mono">≈ {estEarnings} / $1k</span>
                      </div>

                      {/* 8. ANALYZE (1 Col) - RESTAURADO! */}
                      <div className="col-span-1 text-right pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="text-gray-400 hover:text-white transition inline-block p-2 border border-white/10 hover:border-white rounded-sm bg-black hover:bg-white/10"><ArrowUpRight size={16} /></button>
                      </div>

                    </div>
                  );
                })}
                
                <div className="flex justify-between items-center py-8 border-t border-white/10 mt-4 text-xs font-mono uppercase tracking-widest">
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className={`flex items-center gap-2 px-4 py-2 border border-white/10 rounded-sm hover:bg-white/5 transition-all ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'text-white hover:text-orange-500 hover:border-orange-500'}`}><ChevronLeft size={14}/> {text.page_prev}</button>
                    <span className="text-gray-500">{text.page_of.split(" ")[0]} <span className="text-white font-bold">{currentPage}</span> {text.page_of} <span className="text-white font-bold">{totalPages}</span></span>
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className={`flex items-center gap-2 px-4 py-2 border border-white/10 rounded-sm hover:bg-white/5 transition-all ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'text-white hover:text-orange-500 hover:border-orange-500'}`}>{text.page_next} <ChevronRight size={14}/></button>
                </div>
              </>
            ) : (
              <div className={`py-32 text-center text-gray-600 font-mono uppercase tracking-widest border-b border-white/10`}><Search size={32} className="mx-auto mb-4 opacity-20"/>{text.no_results}</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}