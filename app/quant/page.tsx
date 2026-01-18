"use client";
import React from "react";
import { Wallet, ArrowRightLeft, Activity } from "lucide-react";
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Bar, BarChart, Cell, ReferenceLine } from "recharts";
import { useLang } from "@/lib/useLang";

// --- DATOS SIMULADOS (MOCK) ---
const MOCK_QUANT_DATA = {
  whaleVsRetail: [
    { date: 'Nov', price: 35000, whaleHoldings: 40, retailHoldings: 10 },
    { date: 'Dec', price: 42000, whaleHoldings: 42, retailHoldings: 12 },
    { date: 'Jan', price: 45000, whaleHoldings: 45, retailHoldings: 15 },
    { date: 'Feb', price: 52000, whaleHoldings: 44, retailHoldings: 20 },
    { date: 'Mar', price: 68000, whaleHoldings: 41, retailHoldings: 30 },
    { date: 'Apr', price: 64000, whaleHoldings: 43, retailHoldings: 28 },
    { date: 'May', price: 66000, whaleHoldings: 46, retailHoldings: 25 },
  ],
  exchangeFlows: [
    { date: 'D1', inflow: 1200, outflow: 800, net: 400 },
    { date: 'D2', inflow: 900, outflow: 1100, net: -200 },
    { date: 'D3', inflow: 1500, outflow: 500, net: 1000 },
    { date: 'D4', inflow: 600, outflow: 2000, net: -1400 },
    { date: 'D5', inflow: 800, outflow: 900, net: -100 },
    { date: 'D6', inflow: 400, outflow: 1200, net: -800 },
  ],
  fundingRates: [
    { asset: "BTC", rate: 0.010, sentiment: "NEUTRAL" },
    { asset: "ETH", rate: 0.015, sentiment: "BULLISH" },
    { asset: "SOL", rate: -0.005, sentiment: "BEARISH" },
    { asset: "DOGE", rate: 0.080, sentiment: "EUPHORIC" },
  ]
};

export default function QuantBtcPage() {
  const { lang } = useLang();
  
  const t = {
    en: { chart_whales: "WHALES VS RETAIL (SMART MONEY DIVERGENCE)", chart_flows: "EXCHANGE NET POSITION CHANGE (BTC)", chart_fund: "FUNDING RATES", legend_price: "BTC Price", legend_whale: "Whale Holdings", legend_retail: "Retail Holdings", lbl_inflow: "NET INFLOW", lbl_outflow: "NET OUTFLOW" },
    es: { chart_whales: "BALLENAS VS RETAIL (DIVERGENCIA)", chart_flows: "CAMBIO NETO EN EXCHANGES (BTC)", chart_fund: "TASAS DE FINANCIAMIENTO", legend_price: "Precio BTC", legend_whale: "Tenencia Ballenas", legend_retail: "Tenencia Retail", lbl_inflow: "ENTRADA NETA", lbl_outflow: "SALIDA NETA" }
  };
  const text = t[lang as keyof typeof t] || t.en;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* WHALES VS RETAIL */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/10 p-1 rounded-sm">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Wallet size={14}/> {text.chart_whales}
                </span>
            </div>
            <div className="h-[400px] p-4">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={MOCK_QUANT_DATA.whaleVsRetail}>
                        <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#fff" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false}/>
                        <XAxis dataKey="date" tick={{fill: '#666', fontSize: 10, fontFamily: 'monospace'}} axisLine={false} tickLine={false}/>
                        <YAxis yAxisId="left" orientation="left" tick={{fill: '#888', fontSize: 10, fontFamily: 'monospace'}} axisLine={false} tickLine={false} tickFormatter={(v)=>`$${v/1000}k`}/>
                        <YAxis yAxisId="right" orientation="right" domain={['auto','auto']} tick={{fill: '#888', fontSize: 10, fontFamily: 'monospace'}} axisLine={false} tickLine={false} hide/>
                        <Tooltip contentStyle={{backgroundColor: '#111', borderColor: '#333', color: '#fff', fontSize: '12px'}}/>
                        <Legend />
                        <Area yAxisId="left" type="monotone" dataKey="price" stroke="#fff" fill="url(#colorPrice)" name={text.legend_price} strokeWidth={2}/>
                        <Line yAxisId="right" type="monotone" dataKey="whaleHoldings" stroke="#f97316" strokeWidth={2} dot={false} name={text.legend_whale} />
                        <Line yAxisId="right" type="monotone" dataKey="retailHoldings" stroke="#10b981" strokeWidth={2} dot={false} name={text.legend_retail} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* SIDEBAR METRICS */}
        <div className="space-y-6">
            <div className="bg-[#0a0a0a] border border-white/10 p-1 rounded-sm">
                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <ArrowRightLeft size={14}/> {text.chart_flows}
                    </span>
                </div>
                <div className="h-[200px] p-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={MOCK_QUANT_DATA.exchangeFlows}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false}/>
                            <Tooltip contentStyle={{backgroundColor: '#111', borderColor: '#333', color: '#fff', fontSize: '12px'}}/>
                            <ReferenceLine y={0} stroke="#666" />
                            <Bar dataKey="net">
                                {MOCK_QUANT_DATA.exchangeFlows.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.net > 0 ? '#ef4444' : '#10b981'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 rounded-sm">
                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Activity size={14}/> {text.chart_fund}
                    </span>
                </div>
                <div className="divide-y divide-white/5">
                    {MOCK_QUANT_DATA.fundingRates.map((item, i) => (
                        <div key={i} className="flex justify-between items-center p-4 hover:bg-white/5 transition">
                            <div className="font-bold text-white text-sm">{item.asset}</div>
                            <div className={`font-mono text-sm ${item.rate > 0.05 ? 'text-red-500' : item.rate < 0 ? 'text-emerald-500' : 'text-gray-300'}`}>
                                {(item.rate * 100).toFixed(3)}%
                            </div>
                            <div className="text-[9px] px-2 py-0.5 bg-white/5 rounded-sm text-gray-400 uppercase border border-white/5">
                                {item.sentiment}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
}