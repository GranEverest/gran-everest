"use client";
import React from "react";
import { Globe, Server } from "lucide-react";

export default function EthEtfPage() {
  return (
    <div>
        <h3 className="text-sm font-mono text-blue-500 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-blue-500/20 pb-2 w-fit">
            <Globe size={16}/> ETH ETF // INSTITUTIONAL TRACKER
        </h3>
        <div className="bg-[#0a0a0a] border border-dashed border-white/10 p-12 rounded-sm text-center h-[600px] flex flex-col items-center justify-center">
            <Server size={48} className="mx-auto text-blue-900 mb-6 animate-pulse"/>
            <p className="font-mono text-sm text-blue-500 tracking-widest uppercase">DATA FEED INITIALIZING...</p>
            <p className="font-mono text-xs text-gray-600 mt-2">WAITING FOR INSTITUTIONAL FLOWS</p>
        </div>
    </div>
  );
}