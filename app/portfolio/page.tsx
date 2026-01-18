"use client";
import { useAccount, useBalance, useDisconnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Wallet, TrendingUp, Layers, LogOut, RefreshCw, Briefcase, ExternalLink, PlusCircle, Trash2, Activity, History, AlertCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useLang } from "@/lib/useLang";

// --- CONFIGURACIÓN DE ESTRATEGIAS INTERNAS ---
const STRATEGY_MAP: Record<string, any> = {
  "0x8d96": { 
    name: "ETH Maximalist",
    protocol: "dHEDGE",
    type: "VAULT",
    risk: "AGGRESSIVE",
    url: "https://www.dhedge.org/", 
    description: "Algorithmic trend trading on ETH/USD pairs.",
    knownApy: 14.5
  },
};

const CHAIN_IDS: Record<number, string> = {
  1: "0x1", 8453: "0x2105", 42161: "0xa4b1", 137: "0x89", 56: "0x38", 10: "0xa"
};

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
    live: "LIVE FEED",
    my_pos: "MY",
    pos: "POSITIONS",
    wallet: "WALLET:",
    net_worth: "TOTAL NET WORTH (EST)",
    all_time: "ALL TIME (TRACKED)",
    history: "PERFORMANCE HISTORY (SNAPSHOTS)",
    managed: "MANAGED STRATEGIES",
    detected: "DETECTED",
    untracked: "UNTRACKED ASSETS",
    no_data: "NOT ENOUGH DATA POINTS.",
    come_back: "COME BACK TOMORROW TO SEE YOUR PERFORMANCE CHART.",
    scanning: "SCANNING...",
    empty: "EMPTY",
    balance: "BALANCE",
    est_apy: "EST. APY",
    risk: "RISK",
    analyze: "ANALYZE",
    track: "TRACK",
    auth: "Portfolio Access",
    connect_msg: "AUTHENTICATE WALLET",
    return_link: "Return to Terminal"
  },
  es: {
    back: "VOLVER A TERMINAL",
    live: "FEED EN VIVO",
    my_pos: "MIS",
    pos: "POSICIONES",
    wallet: "BILLETERA:",
    net_worth: "VALOR NETO TOTAL (EST)",
    all_time: "HISTORICO (RASTREADO)",
    history: "HISTORIAL DE RENDIMIENTO (SNAPSHOTS)",
    managed: "ESTRATEGIAS GESTIONADAS",
    detected: "DETECTADAS",
    untracked: "ACTIVOS NO RASTREADOS",
    no_data: "NO HAY SUFICIENTES DATOS.",
    come_back: "VUELVE MAÑANA PARA VER TU GRÁFICO DE RENDIMIENTO.",
    scanning: "ESCANENDO...",
    empty: "VACIO",
    balance: "SALDO",
    est_apy: "APY EST.",
    risk: "RIESGO",
    analyze: "ANALIZAR",
    track: "RASTREAR",
    auth: "Acceso a Portafolio",
    connect_msg: "AUTENTICAR BILLETERA",
    return_link: "Volver a Terminal"
  }
};

export default function PortfolioPage() {
  const { address, isConnected, chain } = useAccount();
  const { data: balanceData, isLoading: isBalanceLoading } = useBalance({ address });
  const { lang } = useLang();
  const text = t[lang as keyof typeof t]; 
  
  const [tokens, setTokens] = useState<any[]>([]);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [otherAssets, setOtherAssets] = useState<any[]>([]);
  const [isTokensLoading, setIsTokensLoading] = useState(false);
  const [customTracked, setCustomTracked] = useState<string[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [portfolioChange, setPortfolioChange] = useState(0);

  // 1. CARGA DE PREFERENCIAS AISLADAS POR WALLET
  useEffect(() => {
    if (!address) return;
    const storageKey = `user_strategies_${address.toLowerCase()}`;
    const savedStrat = localStorage.getItem(storageKey);
    
    if (savedStrat) {
      try {
        setCustomTracked(JSON.parse(savedStrat));
      } catch (e) {
        setCustomTracked([]);
      }
    } else {
        setCustomTracked([]);
    }

    const savedHistory = localStorage.getItem(`history_${address.toLowerCase()}`);
    if (savedHistory) setHistoryData(JSON.parse(savedHistory));
    else setHistoryData([]);

  }, [address]);

  // 2. FETCH DE DATOS
  const fetchTokens = async () => {
    if (!address || !chain) return;
    setIsTokensLoading(true);
    try {
      const moralisChain = CHAIN_IDS[chain.id] || "0x1";
      const res = await fetch(`/api/wallet?address=${address}&chain=${moralisChain}`);
      const data = await res.json();
      
      if (data.tokens) {
        setTokens(data.tokens);
      }
    } catch (error) {
      console.error("Token error:", error);
    } finally {
      setIsTokensLoading(false);
    }
  };

  useEffect(() => { 
    if (isConnected) fetchTokens(); 
  }, [isConnected, chain, address]);

  // 3. ORGANIZADOR
  useEffect(() => {
    if (tokens.length === 0) return;

    const foundStrategies: any[] = [];
    const others: any[] = [];
    let calculatedTotalDeFi = 0;

    tokens.forEach((token: any) => {
        const addressLower = token.contract.toLowerCase();
        const addressPart = addressLower.substring(0, 6); 
        const officialStrategy = STRATEGY_MAP[addressPart];
        const isCustomTracked = customTracked.includes(addressLower);
        let usdVal = Number(token.usd_value) || 0;
        
        if (officialStrategy || isCustomTracked) {
            calculatedTotalDeFi += usdVal;
            foundStrategies.push({
                ...token,
                ...(officialStrategy || {
                    name: token.name,
                    protocol: "TRACKED ASSET",
                    type: "ASSET",
                    risk: "UNKNOWN",
                    url: `https://debank.com/profile/${address}`,
                    description: "Manual user tracking.",
                    knownApy: null
                }),
                isCustom: !officialStrategy,
                usd_value: usdVal
            });
        } else {
            others.push(token);
        }
    });

    setStrategies(foundStrategies);
    setOtherAssets(others);
    const native = balanceData ? Number(balanceData.formatted) * 2650 : 0; 
    recordHistorySnapshot(native + calculatedTotalDeFi);
  }, [tokens, customTracked, balanceData]); 

  const trackToken = (contractAddress: string) => {
    if (!address) return;
    const lowerAddr = contractAddress.toLowerCase();
    const storageKey = `user_strategies_${address.toLowerCase()}`;
    if (!customTracked.includes(lowerAddr)) {
        const newTracked = [...customTracked, lowerAddr];
        setCustomTracked(newTracked);
        localStorage.setItem(storageKey, JSON.stringify(newTracked));
    }
  };

  const untrackToken = (contractAddress: string) => {
    if (!address) return;
    const lowerAddr = contractAddress.toLowerCase();
    const newTracked = customTracked.filter(addr => addr !== lowerAddr);
    setCustomTracked(newTracked);
    localStorage.setItem(`user_strategies_${address.toLowerCase()}`, JSON.stringify(newTracked));
  };

  const recordHistorySnapshot = (totalValue: number) => {
    if (totalValue <= 0 || !address) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const fullDate = now.toISOString().split('T')[0]; 
    const key = `history_${address.toLowerCase()}`;
    const currentHistory = JSON.parse(localStorage.getItem(key) || "[]");
    const filteredHistory = currentHistory.filter((h: any) => h.fullDate !== fullDate);
    const newEntry = { date: dateStr, fullDate: fullDate, value: totalValue, timestamp: now.getTime() };
    const newHistory = [...filteredHistory, newEntry].sort((a: any, b: any) => a.timestamp - b.timestamp).slice(-30);
    setHistoryData(newHistory);
    if(JSON.stringify(newHistory) !== JSON.stringify(currentHistory)) {
        localStorage.setItem(key, JSON.stringify(newHistory));
    }
    if (newHistory.length > 1) {
        const first = newHistory[0].value;
        const last = newHistory[newHistory.length - 1].value;
        setPortfolioChange(((last - first) / first) * 100);
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const rawBalance = balanceData && balanceData.formatted ? parseFloat(balanceData.formatted) : 0;
  const safeBalance = isNaN(rawBalance) ? 0 : rawBalance;
  const ethPrice = 2650; 
  const nativeValue = safeBalance * ethPrice;
  const totalStrategyValue = strategies.reduce((acc, s) => acc + (Number(s.usd_value) || 0), 0);
  const totalNetWorth = nativeValue + totalStrategyValue;

  if (!isConnected) {
    return (
        <main className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans flex flex-col items-center justify-center relative overflow-hidden">
        <style jsx global>{customStyles}</style>
        <div className="fixed inset-0 z-0 pointer-events-none opacity-20 bg-grid-pattern"></div>
        <div className="z-10 bg-[#0a0a0a] border border-white/10 p-12 rounded-sm text-center max-w-lg w-full shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <Wallet size={48} className="mx-auto text-gray-600 mb-6"/>
            <h1 className="text-2xl font-bold text-white uppercase tracking-widest mb-2">{text.auth}</h1>
            <div className="flex justify-center scale-110 mt-6"><ConnectButton label={text.connect_msg} /></div>
            <Link href="/" className="mt-12 block text-xs font-mono text-gray-600 hover:text-white transition uppercase">{text.return_link}</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans pb-20 relative">
      <style jsx global>{customStyles}</style>
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20 bg-grid-pattern"></div>

      {/* --- NAVBAR UNIFICADO (Top-0, Z-100, Sólido) --- */}
      <nav className="fixed w-full top-0 z-[100] border-b border-white/10 bg-[#050505]">
        <div className="max-w-[1920px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-white transition uppercase font-mono text-xs tracking-widest group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform"/> {text.back}
          </Link>
          
          <div className="flex items-center gap-4">
             {/* LIVE FEED BADGE */}
             <div className="text-[10px] font-mono text-emerald-500 flex items-center gap-2 px-3 py-1 border border-emerald-500/30 rounded-sm bg-emerald-500/5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> {text.live}
             </div>
             
             {/* CONNECT BUTTON CON CADENA */}
             <div className="scale-90">
                <ConnectButton showBalance={false} chainStatus="icon" accountStatus={{ smallScreen: 'avatar', largeScreen: 'full', }} />
             </div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1800px] mx-auto px-6 pt-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 border-b border-white/10 pb-12">
            <div className="lg:col-span-1 flex flex-col justify-end">
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tighter uppercase mb-2">
                    {text.my_pos} <span className="text-zinc-700">|</span> <span className="text-white">{text.pos}</span>
                    </h1>
                    <p className="text-gray-500 font-mono text-xs tracking-widest uppercase flex items-center gap-2">
                        {text.wallet} <span className="text-white bg-[#111] px-2 py-0.5 rounded-sm border border-white/10">{address?.substring(0,8)}...{address?.substring(36)}</span>
                    </p>
                </div>
                
                <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-sm">
                    <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">{text.net_worth}</div>
                    <div className="text-5xl font-mono font-bold text-white tracking-tighter mb-2">
                    {isBalanceLoading ? "..." : `$${totalNetWorth.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                    </div>
                    <div className={`text-xs font-mono font-bold flex items-center gap-2 ${portfolioChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {portfolioChange >= 0 ? <TrendingUp size={14}/> : <Activity size={14}/>}
                        {portfolioChange.toFixed(2)}% {text.all_time}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2 h-[300px] bg-[#0a0a0a] border border-white/10 rounded-sm p-4 relative group">
                <div className="absolute top-4 left-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2 z-10">
                    <History size={12}/> {text.history}
                </div>
                {historyData.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={historyData}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false}/>
                            <XAxis dataKey="date" tick={{fill: '#666', fontSize: 10, fontFamily: 'monospace'}} axisLine={false} tickLine={false}/>
                            <YAxis hide domain={['auto', 'auto']}/>
                            <Tooltip contentStyle={{backgroundColor: '#111', borderColor: '#333', color: '#fff', fontSize: '12px', fontFamily: 'monospace'}} itemStyle={{color: '#f97316'}} formatter={(value: number) => [`$${value.toLocaleString()}`, 'Net Worth']}/>
                            <Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 font-mono text-xs gap-3">
                        <Activity size={32} className="opacity-20"/>
                        <p>{text.no_data}</p>
                        <p className="text-[10px]">{text.come_back}</p>
                    </div>
                )}
            </div>
        </div>

        <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
                <Briefcase size={16} className="text-orange-500"/>
                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-widest">{text.managed}</h3>
                <span className="text-[10px] bg-orange-500/10 text-orange-500 px-2 rounded-full font-bold">{strategies.length} {text.detected}</span>
            </div>
            {strategies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {strategies.map((strat, i) => (
                        <div key={i} className="bg-[#0a0a0a] border border-orange-500/30 rounded-sm p-6 relative overflow-hidden group hover:border-orange-500/60 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition"><Layers size={80}/></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-500 text-black font-bold flex items-center justify-center rounded-sm text-sm shrink-0">{strat.symbol[0]}</div>
                                        <div className="overflow-hidden">
                                            <div className="text-white font-bold uppercase tracking-tight truncate">{strat.name}</div>
                                            <div className="text-[10px] text-orange-400 font-mono uppercase truncate">{strat.protocol}</div>
                                        </div>
                                    </div>
                                    {strat.isCustom ? (
                                        <button onClick={() => untrackToken(strat.contract)} className="text-gray-500 hover:text-red-500 transition"><Trash2 size={14}/></button>
                                    ) : (
                                        <div className="bg-orange-900/20 text-orange-500 border border-orange-500/20 px-2 py-1 text-[9px] font-bold uppercase rounded-sm">{strat.risk}</div>
                                    )}
                                </div>
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <div className="text-[10px] text-gray-500 font-mono uppercase">{text.balance}</div>
                                        <div className="text-2xl text-white font-mono font-bold tracking-tighter">
                                            {Number(strat.balance).toFixed(2)} <span className="text-sm text-gray-600">{strat.symbol}</span>
                                        </div>
                                        {strat.usd_value > 0 ? (
                                            <div className="text-xs text-emerald-500 font-mono mt-1">≈ ${Number(strat.usd_value).toLocaleString()} USD</div>
                                        ) : (
                                            <div className="text-[10px] text-orange-500/50 font-mono mt-1 flex items-center gap-1"><AlertCircle size={10}/> PRICE DATA UNAVAILABLE</div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                                        <div>
                                            <div className="text-[9px] text-gray-500 font-mono uppercase">{text.est_apy}</div>
                                            <div className={`font-mono font-bold ${strat.knownApy ? 'text-emerald-400' : 'text-gray-600'}`}>{strat.knownApy ? `${strat.knownApy}%` : '---'}</div>
                                        </div>
                                        <div>
                                            <div className="text-[9px] text-gray-500 font-mono uppercase">{text.risk}</div>
                                            <div className="text-white font-mono font-bold text-xs">{strat.risk || "UNKNOWN"}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Link href={strat.url} target="_blank" className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs font-mono font-bold uppercase py-2 rounded-sm text-center flex items-center justify-center gap-2 border border-white/5 transition">
                                        {text.analyze} <ExternalLink size={12}/>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-[#0a0a0a] border border-dashed border-white/10 rounded-sm p-8 text-center">
                    <p className="text-gray-500 text-xs font-mono">{text.empty}</p>
                </div>
            )}
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-sm overflow-hidden mb-20 opacity-90 hover:opacity-100 transition">
             <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#111]">
                <div className="flex items-center gap-3">
                    <Wallet size={14} className="text-gray-500"/>
                    <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">{text.untracked}</h3>
                </div>
                <button onClick={fetchTokens} disabled={isTokensLoading} className="text-gray-500 hover:text-white transition">
                    <RefreshCw size={14} className={isTokensLoading ? "animate-spin" : ""}/>
                </button>
            </div>
            {isTokensLoading ? (
                 <div className="p-12 text-center text-xs font-mono animate-pulse text-gray-500">{text.scanning}</div>
            ) : otherAssets.length > 0 ? (
                <div className="grid grid-cols-1 divide-y divide-white/5">
                {otherAssets.map((token, i) => (
                    <div key={i} className="flex justify-between items-center p-4 hover:bg-white/5 text-sm group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-gray-400">{token.symbol?.[0]}</div>
                            <div>
                                <div className="text-gray-300 font-mono text-xs font-bold">{token.name}</div>
                                <div className="text-[10px] text-gray-600 font-mono">{token.symbol}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="font-mono text-gray-400 text-xs">{Number(token.balance).toFixed(4)}</div>
                                {token.usd_value > 0 ? (
                                    <div className="text-[10px] text-emerald-600 font-mono">${Number(token.usd_value).toLocaleString()}</div>
                                ) : (
                                    <div className="text-[9px] text-gray-700 font-mono">$-.--</div>
                                )}
                            </div>
                            <button onClick={() => trackToken(token.contract)} className="text-gray-600 hover:text-orange-500 transition p-2 border border-transparent hover:border-orange-500/30 rounded-sm flex items-center gap-2">
                                <PlusCircle size={16}/> <span className="hidden group-hover:inline text-[10px] font-bold uppercase">{text.track}</span>
                            </button>
                        </div>
                    </div>
                ))}
                </div>
            ) : (
                <div className="p-6 text-center text-[10px] text-gray-600 font-mono">{text.empty}</div>
            )}
        </div>
      </div>
    </main>
  );
}