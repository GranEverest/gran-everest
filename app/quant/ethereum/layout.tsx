"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, Globe, Layers, Flame } from "lucide-react";

export default function EthereumLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { name: "STAKING", path: "/quant/ethereum/staking", icon: Lock },
    { name: "ETF TRACKER", path: "/quant/ethereum/etf", icon: Globe },
    { name: "L2 WARS", path: "/quant/ethereum/l2", icon: Layers }, // Futuro
    { name: "GAS & FEES", path: "/quant/ethereum/gas", icon: Flame }, // Futuro
  ];

  return (
    <div className="w-full">
      {/* SUB-NAVBAR DE ETHEREUM */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-white/5 pb-4">
        {tabs.map((tab) => {
          const isActive = pathname === tab.path;
          return (
            <Link key={tab.path} href={tab.path}>
              <button
                className={`px-4 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest border transition-all rounded-sm flex items-center gap-2 ${
                  isActive
                    ? "border-purple-500 bg-purple-500/10 text-purple-500"
                    : "border-white/5 text-gray-600 hover:text-white hover:border-white/20"
                }`}
              >
                <tab.icon size={12} /> {tab.name}
              </button>
            </Link>
          );
        })}
      </div>

      {/* CONTENIDO DE LA SUB-PÁGINA (Staking, ETF, etc.) */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {children}
      </div>
    </div>
  );
}