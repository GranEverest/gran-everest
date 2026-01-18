"use client";
import React, { useEffect, useState } from "react";
import { getMarketGlobals } from "@/lib/api";
import { Flame, Zap } from "lucide-react";

export default function MacroBar() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getMarketGlobals().then(setData);
    const interval = setInterval(() => getMarketGlobals().then(setData), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!data || !data.ticker) return <div className="h-8 bg-[#020202] border-b border-white/5 w-full fixed top-0 z-[60]"></div>;

  // Duplicamos la lista para hacer el efecto "infinito" sin saltos
  const loopData = [...data.ticker, ...data.ticker]; 

  return (
    <div className="h-8 bg-[#020202] border-b border-white/10 w-full fixed top-0 z-[60] flex items-center overflow-hidden text-[10px] font-mono tracking-widest text-gray-500 uppercase select-none">
      
      {/* SECCIÓN ESTÁTICA IZQUIERDA (GAS) */}
      <div className="flex items-center gap-2 px-4 bg-[#020202] h-full z-10 border-r border-white/10 shrink-0">
         <Flame size={10} className="text-orange-500"/> 
         <span className="text-white">{data.gas} GWEI</span>
      </div>

      {/* CINTA CORREDORA (TICKER) */}
      <div className="flex items-center animate-ticker whitespace-nowrap">
        {loopData.map((coin: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mx-6">
            <span className="font-bold text-orange-500">{coin.symbol}</span>
            <span className="text-white">${coin.price < 1 ? coin.price.toFixed(4) : coin.price.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
            <span className={coin.change >= 0 ? "text-emerald-500" : "text-red-500"}>
              {coin.change > 0 ? "▲" : "▼"} {Math.abs(coin.change).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>

      {/* SOMBRA A LA DERECHA PARA SUAVIZAR */}
      <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none"></div>
    </div>
  );
}