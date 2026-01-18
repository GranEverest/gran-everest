"use client";
import { useEffect, useState } from "react";
import { getChainStats } from "@/lib/api";
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, ReferenceLine, LineChart, Line, Legend 
} from "recharts";
import { 
  ArrowLeft, Activity, Globe, Zap, Layers, BarChart3, TrendingUp, AlertTriangle, 
  ArrowRightLeft, Users, Disc, TrendingDown 
} from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useLang } from "@/lib/useLang"; 

// --- DATA SIMULATION (MOCKUP PARA DATOS AVANZADOS) ---
const MOCK_DATA = {
  stablecoinFlows: [
    { date: 'Jan 01', ethereum: 65, tron: 45, solana: 10, l2s: 5 },
    { date: 'Jan 04', ethereum: 66, tron: 46, solana: 12, l2s: 6 },
    { date: 'Jan 08', ethereum: 64, tron: 47, solana: 15, l2s: 8 },
    { date: 'Jan 12', ethereum: 63, tron: 48, solana: 18, l2s: 10 },
    { date: 'Jan 16', ethereum: 62, tron: 48, solana: 22, l2s: 12 },
    { date: 'Jan 20', ethereum: 60, tron: 49, solana: 25, l2s: 15 },
  ],
  bridgeFlows: [
    { chain: 'Base', flow: 45.2, fill: '#0052ff' }, // Base Blue
    { chain: 'Solana', flow: 32.5, fill: '#14f195' }, // Solana Green
    { chain: 'Arbitrum', flow: 12.1, fill: '#2d374b' }, // Arb Blue/Grey
    { chain: 'Avalanche', flow: -5.4, fill: '#e84142' }, // Avax Red
    { chain: 'Ethereum', flow: -28.5, fill: '#627eea' }, // Eth Blue (Outflow)
    { chain: 'Polygon', flow: -8.2, fill: '#8247e5' }, // Matic Purple
  ],
  pegMonitor: [
    { asset: "USDT", price: 1.0002, status: "OK", risk: "LOW" },
    { asset: "USDC", price: 1.0000, status: "OK", risk: "LOW" },
    { asset: "DAI", price: 0.9998, status: "OK", risk: "LOW" },
    { asset: "USDe", price: 0.9985, status: "WATCH", risk: "MED" },
    { asset: "crvUSD", price: 0.9991, status: "OK", risk: "LOW" },
  ],
  activeUsers: [
    { date: 'Mon', sol: 850, bnb: 600, eth: 350, base: 200 },
    { date: 'Tue', sol: 880, bnb: 590, eth: 360, base: 220 },
    { date: 'Wed', sol: 900, bnb: 580, eth: 340, base: 250 },
    { date: 'Thu', sol: 870, bnb: 610, eth: 380, base: 280 },
    { date: 'Fri', sol: 950, bnb: 620, eth: 400, base: 310 },
    { date: 'Sat', sol: 1020, bnb: 650, eth: 320, base: 350 },
    { date: 'Sun', sol: 1100, bnb: 640, eth: 310, base: 380 },
  ]
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
    badge_title: "GLOBAL MACRO VIEW",
    live: "LIVE FEED",
    title: "MARKET",
    title_span: "PULSE",
    desc: "Global liquidity tracking across multiple chains. Use this data to determine capital rotation and ecosystem health before deploying strategies.",
    tvl: "TOTAL VALUE LOCKED",
    stables: "STABLECOIN M.CAP",
    active_chains: "ACTIVE CHAINS TRACKED",
    dominance: "DOMINANCE (ETH)",
    
    // Nombres de Secciones
    sec_wars: "THE BLOCKCHAIN WARS (TVL)",
    movers: "ECOSYSTEM MOVERS",
    sec_flow: "LIQUIDITY ROTATION",
    sec_risk: "SYSTEMIC RISK MONITOR",
    sec_adopt: "NETWORK ADOPTION",

    // Gráficos
    chart_stables: "STABLECOIN ISSUANCE (SUPPLY TREND)",
    chart_bridge: "NET BRIDGE FLOWS (7D)",
    chart_peg: "PEG STABILITY MONITOR",
    chart_dau: "DAILY ACTIVE USERS (K)",
    
    loading: "LOADING ON-CHAIN DATA...",
    compatible: "EVM & SVM COMPATIBLE",
    concentration: "HIGH CONCENTRATION"
  },
  es: {
    back: "VOLVER A TERMINAL",
    badge_title: "VISION MACRO GLOBAL",
    live: "FEED EN VIVO",
    title: "PULSO DE",
    title_span: "MERCADO",
    desc: "Rastreo de liquidez global en múltiples cadenas. Usa estos datos para determinar la rotación de capital y salud del ecosistema antes de desplegar estrategias.",
    tvl: "VALOR TOTAL BLOQUEADO",
    stables: "M.CAP STABLECOINS",
    active_chains: "CADENAS ACTIVAS",
    dominance: "DOMINANCIA (ETH)",
    
    sec_wars: "LA GUERRA DE BLOCKCHAINS (TVL)",
    movers: "MOVIMIENTOS DEL ECOSISTEMA",
    sec_flow: "ROTACION DE LIQUIDEZ",
    sec_risk: "MONITOR DE RIESGO SISTEMICO",
    sec_adopt: "ADOPCION DE RED",

    chart_stables: "EMISION DE STABLECOINS (TENDENCIA)",
    chart_bridge: "FLUJOS NETOS PUENTES (7D)",
    chart_peg: "ESTABILIDAD DE PEG",
    chart_dau: "USUARIOS ACTIVOS DIARIOS (K)",

    loading: "CARGANDO DATOS ON-CHAIN...",
    compatible: "COMPATIBLE EVM & SVM",
    concentration: "ALTA CONCENTRACION"
  }
};

const formatMoney = (val: number) => {
  if (val >= 1000000000) return `$${(val / 1000000000).toFixed(1)}B`;
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  return `$${val.toFixed(0)}`;
};

export default function MarketPage() {
  const [chains, setChains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { lang } = useLang();
  const text = t[lang as keyof typeof t];

  useEffect(() => {
    getChainStats().then((data) => {
      setChains(data);
      setLoading(false);
    });
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans selection:bg-orange-500/30 pb-20 relative">
      <style jsx global>{customStyles}</style>
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20 bg-grid-pattern"></div>
      
      {/* NAVBAR UNIFICADO */}
      <nav className="fixed w-full top-0 z-[100] border-b border-white/10 bg-[#050505]">
        <div className="max-w-[1920px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-white transition uppercase font-mono text-xs tracking-widest group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform"/> {text.back}
          </Link>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex text-[10px] font-mono font-bold text-orange-500 items-center gap-2 px-3 py-1 border border-orange-500/30 rounded-sm bg-orange-500/5">
                <Globe size={12}/> {text.badge_title}
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

      <div className="max-w-[1800px] mx-auto px-6 pt-24 relative z-10">
        
        {/* HEADER */}
        <div className="mb-12 border-b border-white/10 pb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tighter uppercase mb-4">
              {text.title} <span className="text-zinc-700">|</span> <span className="text-white">{text.title_span}</span>
            </h1>
            <p className="text-gray-500 font-mono text-xs tracking-widest uppercase max-w-2xl">
                {text.desc}
            </p>
        </div>

        {/* TOP METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-16">
            <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition"><Activity size={64}/></div>
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">{text.tvl}</div>
                <div className="text-3xl font-mono font-bold text-white tracking-tighter">$86.4B</div>
                <div className="text-[10px] text-emerald-500 mt-2 font-mono flex items-center gap-1"><TrendingUp size={10}/> +2.4% (24H)</div>
            </div>
            <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition"><Disc size={64}/></div>
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">{text.stables}</div>
                <div className="text-3xl font-mono font-bold text-white tracking-tighter">$142.1B</div>
                <div className="text-[10px] text-emerald-500 mt-2 font-mono flex items-center gap-1"><TrendingUp size={10}/> +0.8% (7D)</div>
            </div>
            <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition"><Layers size={64}/></div>
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">{text.active_chains}</div>
                <div className="text-3xl font-mono font-bold text-white tracking-tighter">142</div>
                <div className="text-[10px] text-gray-500 mt-2 font-mono">{text.compatible}</div>
            </div>
            <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition"><Zap size={64}/></div>
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">{text.dominance}</div>
                <div className="text-3xl font-mono font-bold text-white tracking-tighter">58.2%</div>
                <div className="text-[10px] text-orange-500 mt-2 font-mono">{text.concentration}</div>
            </div>
        </div>

        {/* --- SECTION 1: BLOCKCHAIN WARS (TVL RESTAURADO) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-20">
            <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/10 p-1 rounded-sm">
                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-xs font-mono font-bold text-orange-500 uppercase tracking-widest flex items-center gap-2">
                        <BarChart3 size={14}/> {text.sec_wars}
                    </h3>
                </div>
                <div className="h-[400px] p-6">
                    {loading ? (
                        <div className="h-full flex items-center justify-center text-xs font-mono animate-pulse">{text.loading}</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chains} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
                                <XAxis type="number" stroke="#333" tickFormatter={(val) => `$${(val/1000000000).toFixed(0)}B`} tick={{fill: '#555', fontSize: 9, fontFamily: 'monospace'}} axisLine={false} tickLine={false} />
                                <YAxis dataKey="name" type="category" stroke="#333" tick={{fill: '#fff', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold'}} width={80} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    cursor={{fill: '#ffffff05'}}
                                    contentStyle={{backgroundColor: '#000', borderColor: '#333', color: '#fff', fontSize: '12px'}}
                                    formatter={(value: number) => [formatMoney(value), "TVL"]}
                                />
                                <Bar dataKey="tvl" radius={[0, 4, 4, 0]} barSize={20}>
                                    {chains.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? "#3b82f6" : index === 1 ? "#a855f7" : "#333"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 p-1 rounded-sm flex flex-col">
                 <div className="p-4 border-b border-white/5">
                    <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">{text.movers}</h3>
                </div>
                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                    {loading ? (
                         <div className="space-y-4">
                            {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-white/5 animate-pulse rounded-sm"></div>)}
                         </div>
                    ) : (
                        <div className="space-y-1">
                            {chains.map((chain, i) => (
                                <div key={i} className="flex items-center justify-between p-3 hover:bg-white/5 transition border-b border-white/5 last:border-0 cursor-default group">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-mono text-gray-600 w-4">0{i+1}</span>
                                        <span className="text-sm font-bold text-white group-hover:text-orange-500 transition">{chain.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-mono text-gray-400">{formatMoney(chain.tvl)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* SECTION 2: LIQUIDITY ROTATION (STABLES & BRIDGES) */}
        <div className="mb-20">
            <h3 className="text-sm font-mono text-orange-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <ArrowRightLeft size={16}/> {text.sec_flow}
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* CHART: STABLECOIN TRENDS */}
                <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/10 p-1 rounded-sm">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center">
                        <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">{text.chart_stables}</span>
                    </div>
                    <div className="h-[300px] p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={MOCK_DATA.stablecoinFlows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorEth" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#627eea" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#627eea" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorTron" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ff0013" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#ff0013" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorSol" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#14f195" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#14f195" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false}/>
                                <XAxis dataKey="date" tick={{fill: '#666', fontSize: 10, fontFamily: 'monospace'}} axisLine={false} tickLine={false}/>
                                <YAxis tick={{fill: '#666', fontSize: 10, fontFamily: 'monospace'}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}B`}/>
                                <Tooltip contentStyle={{backgroundColor: '#111', borderColor: '#333', color: '#fff', fontSize: '12px'}}/>
                                <Area type="monotone" dataKey="ethereum" stackId="1" stroke="#627eea" fill="url(#colorEth)" />
                                <Area type="monotone" dataKey="tron" stackId="1" stroke="#ff0013" fill="url(#colorTron)" />
                                <Area type="monotone" dataKey="solana" stackId="1" stroke="#14f195" fill="url(#colorSol)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* CHART: BRIDGE NET FLOWS */}
                <div className="bg-[#0a0a0a] border border-white/10 p-1 rounded-sm">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center">
                        <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">{text.chart_bridge}</span>
                    </div>
                    <div className="h-[300px] p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={MOCK_DATA.bridgeFlows} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
                                <XAxis type="number" stroke="#333" tick={{fill: '#555', fontSize: 9, fontFamily: 'monospace'}} axisLine={false} tickLine={false} />
                                <YAxis dataKey="chain" type="category" stroke="#333" tick={{fill: '#fff', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold'}} width={70} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    cursor={{fill: '#ffffff05'}}
                                    contentStyle={{backgroundColor: '#000', borderColor: '#333', color: '#fff', fontSize: '12px'}}
                                    formatter={(value: number) => [`${value > 0 ? '+' : ''}$${Math.abs(value)}M`, "Net Flow"]}
                                />
                                <Bar dataKey="flow" radius={[2, 2, 2, 2]} barSize={15}>
                                    {MOCK_DATA.bridgeFlows.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                                <ReferenceLine x={0} stroke="#666" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
            
            {/* SECTION 3: SYSTEMIC RISK (PEG MONITOR) */}
            <div>
                <h3 className="text-sm font-mono text-orange-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <AlertTriangle size={16}/> {text.sec_risk}
                </h3>
                <div className="bg-[#0a0a0a] border border-white/10 rounded-sm overflow-hidden">
                    <div className="grid grid-cols-4 p-4 border-b border-white/10 bg-[#111] text-[10px] font-mono text-gray-500 uppercase">
                        <div>ASSET</div>
                        <div className="text-right">PRICE (USD)</div>
                        <div className="text-center">STATUS</div>
                        <div className="text-right">RISK LEVEL</div>
                    </div>
                    {MOCK_DATA.pegMonitor.map((item, i) => (
                        <div key={i} className="grid grid-cols-4 p-4 border-b border-white/5 hover:bg-white/5 items-center font-mono text-xs">
                            <div className="font-bold text-white">{item.asset}</div>
                            <div className={`text-right ${item.price < 0.999 ? 'text-red-500 font-bold' : item.price > 1.001 ? 'text-orange-500' : 'text-gray-400'}`}>
                                ${item.price.toFixed(4)}
                            </div>
                            <div className="text-center">
                                <span className={`px-2 py-0.5 rounded-sm text-[9px] ${item.status === 'OK' ? 'bg-emerald-900/20 text-emerald-500 border border-emerald-500/20' : 'bg-yellow-900/20 text-yellow-500 border border-yellow-500/20'}`}>
                                    {item.status}
                                </span>
                            </div>
                            <div className="text-right text-gray-500">{item.risk}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* SECTION 4: ADOPTION (DAU) */}
            <div>
                <h3 className="text-sm font-mono text-orange-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Users size={16}/> {text.sec_adopt}
                </h3>
                <div className="bg-[#0a0a0a] border border-white/10 p-1 rounded-sm h-[280px]">
                     <div className="p-4 border-b border-white/5 flex justify-between items-center">
                        <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">{text.chart_dau}</span>
                    </div>
                    <div className="h-[220px] p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={MOCK_DATA.activeUsers}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false}/>
                                <XAxis dataKey="date" tick={{fill: '#666', fontSize: 10, fontFamily: 'monospace'}} axisLine={false} tickLine={false}/>
                                <YAxis tick={{fill: '#666', fontSize: 10, fontFamily: 'monospace'}} axisLine={false} tickLine={false}/>
                                <Tooltip contentStyle={{backgroundColor: '#111', borderColor: '#333', color: '#fff', fontSize: '12px'}}/>
                                <Legend wrapperStyle={{paddingTop: '10px', fontSize: '10px', fontFamily: 'monospace'}}/>
                                <Line type="monotone" dataKey="sol" stroke="#14f195" strokeWidth={2} dot={false} name="SOLANA" />
                                <Line type="monotone" dataKey="bnb" stroke="#f0b90b" strokeWidth={2} dot={false} name="BSC" />
                                <Line type="monotone" dataKey="eth" stroke="#627eea" strokeWidth={2} dot={false} name="ETHEREUM" />
                                <Line type="monotone" dataKey="base" stroke="#0052ff" strokeWidth={2} dot={false} name="BASE" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

        </div>

      </div>
    </main>
  );
}