"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getStrategyMetadata, getStrategyHistory } from "@/lib/api";
import { ArrowLeft, Shield, Activity, TrendingUp, TrendingDown, CheckCircle, AlertOctagon, Timer, BarChart3, Coins, Cpu, AlertTriangle, ArrowUpRight, Crosshair } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAccount } from "wagmi";
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
    back: "BACK TO TERMINAL",
    badge_title: "STRATEGY INTELLIGENCE",
    live: "LIVE FEED",
    loading: "ESTABLISHING SECURE UPLINK...",
    signal_lost: "SIGNAL LOST",
    signal_desc: "The strategy data stream could not be established. The protocol API might be limiting requests or the Pool ID is deprecated.",
    return: "RETURN TO TERMINAL"
  },
  es: {
    back: "VOLVER A TERMINAL",
    badge_title: "INTELIGENCIA DE ESTRATEGIA",
    live: "FEED EN VIVO",
    loading: "ESTABLECIENDO ENLACE SEGURO...",
    signal_lost: "SEÑAL PERDIDA",
    signal_desc: "No se pudo establecer el flujo de datos de la estrategia. La API del protocolo podría estar limitando solicitudes o el ID del Pool está obsoleto.",
    return: "VOLVER A TERMINAL"
  }
};

export default function StrategyPage({ params }: { params: Promise<{ pool: string }> }) {
  const resolvedParams = use(params);
  const poolId = resolvedParams.pool;

  const router = useRouter();
  const { isConnected } = useAccount();
  const { lang } = useLang();
  const text = t[lang];

  const [metadata, setMetadata] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulatedDeposit, setSimulatedDeposit] = useState(false);
  
  const [netFlow, setNetFlow] = useState({ value: 0, label: "NEUTRAL" });
  const [volatility, setVolatility] = useState(0);
  const [rewardSplit, setRewardSplit] = useState({ base: 0, reward: 0 });

  useEffect(() => {
    async function loadData() {
      if (!poolId) return;
      
      try {
        const meta = await getStrategyMetadata(poolId);
        
        if (!meta) {
            console.warn("Strategy metadata not found for ID:", poolId);
            setLoading(false);
            return;
        }

        const hist = await getStrategyHistory(poolId);
        
        setMetadata(meta);
        
        const safeHist = Array.isArray(hist) ? hist : [];
        const cleanHist = safeHist.slice(-90).map((h: any) => ({
            ...h,
            dateStr: new Date(h.date * 1000).toLocaleDateString('en-US', {month:'short', day:'numeric'}),
            apy: h.apy < 0 ? 0 : h.apy 
        }));
        setHistory(cleanHist);

        if (safeHist.length > 1) {
            const lastTvl = safeHist[safeHist.length - 1].tvlUsd;
            const prevTvl = safeHist[safeHist.length - 2].tvlUsd;
            const diff = lastTvl - prevTvl;
            setNetFlow({
                value: diff,
                label: diff > 0 ? "NET INFLOW" : "NET OUTFLOW"
            });
        }

        if (cleanHist.length > 0) {
            const apys = cleanHist.map((h: any) => h.apy);
            const mean = apys.reduce((a: any, b: any) => a + b, 0) / apys.length;
            const variance = apys.reduce((a: any, b: any) => a + Math.pow(b - mean, 2), 0) / apys.length;
            setVolatility(Math.sqrt(variance));
        }

        const isStable = meta.symbol && meta.symbol.includes("USD");
        setRewardSplit({
            base: isStable ? meta.apy * 0.9 : meta.apy * 0.6,
            reward: isStable ? meta.apy * 0.1 : meta.apy * 0.4
        });

      } catch (error) {
        console.warn("Error loading strategy details:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [poolId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center font-mono">
        <Cpu size={48} className="animate-pulse text-orange-500 mb-4"/>
        <p className="tracking-widest text-xs animate-pulse">{text.loading}</p>
      </div>
    );
  }

  if (!metadata) {
      return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center font-mono p-6 text-center">
            <style jsx global>{customStyles}</style>
            <div className="fixed inset-0 z-0 pointer-events-none opacity-20 bg-grid-pattern"></div>
            <AlertTriangle size={48} className="text-red-500 mb-4"/>
            <h1 className="text-xl font-bold uppercase mb-2">{text.signal_lost}</h1>
            <p className="text-gray-500 text-xs mb-6 max-w-md">{text.signal_desc} ({poolId})</p>
            <button onClick={() => router.back()} className="border border-white/20 px-6 py-3 hover:bg-white hover:text-black transition uppercase text-xs font-bold tracking-widest relative z-10">{text.return}</button>
        </div>
      );
  }

  const isPositiveFlow = netFlow.value >= 0;
  const riskColor = metadata.ilRisk === 'yes' ? 'text-red-500' : 'text-emerald-500';

  return (
    <main className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans pb-20 relative selection:bg-orange-500/30">
      <style jsx global>{customStyles}</style>
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20 bg-grid-pattern"></div>

      {/* NAVBAR UNIFICADO: TOP-0 */}
      <nav className="fixed w-full top-0 z-[100] border-b border-white/10 bg-[#050505]">
        <div className="max-w-[1920px] mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* IZQUIERDA */}
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-white transition uppercase font-mono text-xs tracking-widest group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform"/> {text.back}
          </button>
          
          {/* DERECHA */}
          <div className="flex items-center gap-4">
             {/* IDENTIFICADOR */}
             <div className="hidden md:flex text-[10px] font-mono font-bold text-orange-500 items-center gap-2 px-3 py-1 border border-orange-500/30 rounded-sm bg-orange-500/5">
                <Crosshair size={12}/> {text.badge_title}
             </div>

             {/* LIVE FEED */}
             <div className="text-[10px] font-mono text-emerald-500 flex items-center gap-2 px-3 py-1 border border-emerald-500/30 rounded-sm bg-emerald-500/5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> {text.live}
             </div>

             <div className="scale-90">
                <ConnectButton showBalance={false} chainStatus="icon" accountStatus={{ smallScreen: 'avatar', largeScreen: 'full', }} />
             </div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto px-6 pt-24 relative z-10">
        
        {/* HERO SECTION */}
        <div className="mb-8 border-b border-white/10 pb-8 flex flex-col md:flex-row justify-between items-end gap-6">
             <div className="flex items-start gap-5">
                <div className="w-20 h-20 border border-white/20 bg-[#111] flex items-center justify-center text-3xl font-bold text-white uppercase tracking-tighter shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                    {metadata.symbol ? metadata.symbol.substring(0,2) : "??"}
                </div>
                <div>
                    <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tighter uppercase mb-2">{metadata.project}</h1>
                    <div className="flex items-center gap-3">
                            <span className="text-xl text-orange-500 font-mono font-bold">{metadata.symbol}</span>
                            <span className="bg-white/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest text-gray-300 rounded-sm border border-white/5">{metadata.chain}</span>
                            <span className="bg-white/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest text-gray-300 rounded-sm border border-white/5">{metadata.poolMeta || "CORE POOL"}</span>
                    </div>
                </div>
             </div>
             
             <div className="flex gap-8 text-right">
                 <div>
                     <div className="text-[10px] text-gray-500 font-mono uppercase mb-1">TOTAL LIQUIDITY (TVL)</div>
                     <div className="text-3xl font-mono font-bold text-white tracking-tighter">${(metadata.tvlUsd / 1000000).toFixed(2)}M</div>
                 </div>
                 <div>
                     <div className="text-[10px] text-gray-500 font-mono uppercase mb-1">CURRENT APY</div>
                     <div className="text-3xl font-mono font-bold text-emerald-500 tracking-tighter">{metadata.apy.toFixed(2)}%</div>
                 </div>
             </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN */}
            <div className="lg:col-span-8 space-y-8">
                <div className="h-[400px] bg-[#0a0a0a] border border-white/10 rounded-sm p-6 relative group">
                    <div className="absolute top-6 left-6 z-10 flex gap-4">
                        <div className="text-xs font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2">
                             <Activity size={12}/> PERFORMANCE CURVE (90D)
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history}>
                            <defs>
                                <linearGradient id="colorApy" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false}/>
                            <XAxis dataKey="dateStr" tick={{fill: '#444', fontSize: 10, fontFamily: 'monospace'}} axisLine={false} tickLine={false} minTickGap={40}/>
                            <YAxis orientation="right" tick={{fill: '#444', fontSize: 10, fontFamily: 'monospace'}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`}/>
                            <Tooltip contentStyle={{backgroundColor: '#111', borderColor: '#333', color: '#fff', fontSize: '12px', fontFamily: 'monospace'}} formatter={(value: number) => [`${value.toFixed(2)}%`, 'APY']}/>
                            <Area type="step" dataKey="apy" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorApy)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#0a0a0a] border border-white/10 p-5 rounded-sm relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest flex items-center gap-2"><BarChart3 size={12}/> 24H NET FLOW</div>
                            <div className={`p-1 rounded-full ${isPositiveFlow ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                                {isPositiveFlow ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                            </div>
                        </div>
                        <div className={`text-2xl font-mono font-bold mb-1 ${isPositiveFlow ? 'text-white' : 'text-red-400'}`}>
                            {isPositiveFlow ? '+' : ''}${(Math.abs(netFlow.value)).toLocaleString('en-US', {maximumFractionDigits: 0})}
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full mt-4 overflow-hidden">
                            <div className={`h-full ${isPositiveFlow ? 'bg-emerald-500' : 'bg-red-500'}`} style={{width: '60%'}}></div>
                        </div>
                        <p className="text-[9px] text-gray-600 mt-2 font-mono">
                            {isPositiveFlow ? "Strong liquidity accumulation detected." : "Capital outflow detected in last 24h."}
                        </p>
                    </div>

                    <div className="bg-[#0a0a0a] border border-white/10 p-5 rounded-sm relative">
                        <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest flex items-center gap-2 mb-4"><Coins size={12}/> YIELD SOURCE</div>
                        <div className="flex items-end gap-2 mb-2">
                             <span className="text-2xl font-mono font-bold text-white">{rewardSplit.base.toFixed(2)}%</span>
                             <span className="text-[10px] text-gray-500 font-mono mb-1">BASE</span>
                        </div>
                        <div className="flex items-end gap-2 mb-4">
                             <span className="text-lg font-mono font-bold text-orange-500">+{rewardSplit.reward.toFixed(2)}%</span>
                             <span className="text-[10px] text-gray-500 font-mono mb-1">REWARDS</span>
                        </div>
                        <div className="flex w-full gap-1">
                            <div className="h-1 bg-white/20" style={{width: '70%'}}></div>
                            <div className="h-1 bg-orange-500" style={{width: '30%'}}></div>
                        </div>
                    </div>

                    <div className="bg-[#0a0a0a] border border-white/10 p-5 rounded-sm relative">
                        <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest flex items-center gap-2 mb-4"><AlertOctagon size={12}/> RISK METRICS</div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] text-gray-400 font-mono">VOLATILITY (30D)</span>
                            <span className={`text-xs font-bold font-mono ${volatility > 2 ? 'text-orange-500' : 'text-emerald-500'}`}>{volatility > 2 ? 'HIGH' : 'LOW'} ({volatility.toFixed(1)})</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] text-gray-400 font-mono">IL RISK</span>
                            <span className={`text-xs font-bold font-mono ${riskColor}`}>{metadata.ilRisk?.toUpperCase() || "NO"}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-gray-400 font-mono">AUDIT STATUS</span>
                            <span className="text-xs font-bold font-mono text-emerald-500 flex items-center gap-1"><Shield size={10}/> VERIFIED</span>
                        </div>
                    </div>
                </div>

                <div className="bg-[#111] border border-white/10 p-6 rounded-sm">
                    <h4 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Timer size={14}/> ROI PROJECTION (1Y ESTIMATE)</h4>
                    <div className="flex items-center justify-between">
                         <div className="text-gray-400 font-mono text-sm">If you deposit <span className="text-white font-bold">$10,000</span> today...</div>
                         <div className="text-right">
                             <div className="text-2xl font-mono font-bold text-emerald-500">+${(10000 * (metadata.apy/100)).toLocaleString('en-US', {maximumFractionDigits: 0})}</div>
                             <div className="text-[10px] text-gray-600 font-mono uppercase">ESTIMATED EARNINGS</div>
                         </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#111] border border-white/10 p-8 rounded-sm sticky top-24 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/5">
                        <span className="text-xs font-bold font-mono uppercase tracking-widest text-gray-500">STRATEGY STATUS</span>
                        <span className="bg-emerald-900/20 text-emerald-500 border border-emerald-500/20 px-2 py-1 text-[10px] font-bold uppercase rounded-sm flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> ACTIVE</span>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 font-mono">Network Cost</span>
                            <span className="text-white font-bold font-mono">~$1.50</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 font-mono">Slippage</span>
                            <span className="text-white font-bold font-mono">&lt; 0.05%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 font-mono">Lock-up Period</span>
                            <span className="text-white font-bold font-mono">NONE</span>
                        </div>
                    </div>

                    {!isConnected ? (
                        <div className="text-center space-y-4">
                            <div className="p-4 bg-orange-500/10 border border-orange-500/20 text-orange-200 text-xs font-mono mb-4">
                                AUTHENTICATION REQUIRED FOR EXECUTION
                            </div>
                            <div className="flex justify-center scale-90">
                                <ConnectButton label="CONNECT WALLET" />
                            </div>
                        </div>
                    ) : !simulatedDeposit ? (
                        <div className="space-y-3">
                            <button 
                                onClick={() => setSimulatedDeposit(true)}
                                className="w-full bg-orange-500 hover:bg-white hover:text-black text-black font-bold uppercase py-4 tracking-widest text-sm transition-all duration-300 flex items-center justify-center gap-2 group"
                            >
                                EXECUTE ORDER <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"/>
                            </button>
                            <p className="text-[9px] text-gray-600 text-center font-mono">
                                Smart Router will optimize for lowest gas on {metadata.chain}.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 text-center animate-in fade-in zoom-in-95">
                            <CheckCircle size={32} className="mx-auto text-emerald-500 mb-2"/>
                            <h3 className="text-white font-bold uppercase tracking-widest mb-1">SIGNAL BROADCASTED</h3>
                            <p className="text-xs text-emerald-400 font-mono mb-4">Routing to Protocol Interface...</p>
                            <a 
                                href={`https://defillama.com/yields/pool/${poolId}`} 
                                target="_blank"
                                className="block w-full bg-emerald-600 text-white py-2 text-xs font-bold uppercase hover:bg-emerald-500 transition"
                            >
                                CONTINUE ON PROTOCOL
                            </a>
                            <button onClick={() => setSimulatedDeposit(false)} className="mt-4 text-[10px] text-gray-500 hover:text-white uppercase border-b border-transparent hover:border-gray-500">CANCEL OPERATION</button>
                        </div>
                    )}
                </div>

                <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-sm">
                    <h4 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest mb-4">ALGORITHMIC INSIGHT</h4>
                    <p className="text-xs text-gray-400 leading-relaxed font-mono text-justify">
                        This strategy leverages <strong>{metadata.project}</strong> on {metadata.chain} to maximize yield on {metadata.symbol}. 
                        Current metrics indicate a <span className={volatility > 2 ? "text-orange-500" : "text-emerald-500"}>{volatility > 2 ? "VOLATILE" : "STABLE"}</span> trend. 
                        The majority of returns are generated via {rewardSplit.base > rewardSplit.reward ? "base trading fees" : "inflationary rewards"}, suggesting a {rewardSplit.base > rewardSplit.reward ? "sustainable organic" : "high-incentive"} yield model.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </main>
  );
}