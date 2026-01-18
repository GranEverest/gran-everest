// lib/api.ts

async function fetchWithRetry(url: string) {
  try {
    // Agrego revalidate para que no sea lento, pero respeto tu estructura
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`Fetch failed for ${url}`, err);
    return null;
  }
}

// --- CLASIFICACIÓN ---
function detectType(project: string, category: string): string {
    const p = (project || "").toUpperCase();
    const c = (category || "").toUpperCase();

    if (["AAVE", "COMPOUND", "SPARK", "MORPHO", "VENUS", "RADIANT", "BENQI", "JUSTLEND", "FLUID"].some(name => p.includes(name))) return "LENDING";
    if (c.includes("LENDING") || c.includes("CDP") || c.includes("MONEY MARKET")) return "LENDING";

    if (["BEEFY", "YEARN", "HARVEST", "PENDLE", "AURA", "CONVEX", "ARRAKIS", "GAMMA", "BUNGEE", "ORIGIN"].some(name => p.includes(name))) return "VAULT";
    if (c.includes("VAULT") || c.includes("YIELD") || c.includes("OPTIMIZER") || c.includes("AGGREGATOR") || c.includes("INDEX") || c.includes("FARM")) return "VAULT";

    if (c.includes("STABLE") || c.includes("PEGGED")) return "STABLES";
    
    return "LIQUIDITY";
}

function detectRisk(pool: any): string {
    if (pool.stablecoin) return "LOW";
    if (pool.ilRisk === 'no') return "MED";
    if (pool.apy > 20) return "HIGH"; 
    return "HIGH"; 
}

// --- API FUNCTIONS ---

export async function getMarketGlobals() {
    const data = await fetchWithRetry("/api/proxy/prices/coingecko:bitcoin,coingecko:ethereum");
    if (!data || !data.coins) return { btc: 0, eth: 0, dominance: 0, gas: 0 };
    
    return {
        btc: data.coins["coingecko:bitcoin"]?.price || 0,
        eth: data.coins["coingecko:ethereum"]?.price || 0,
        dominance: 0,
        gas: 0
    };
}

export async function getTopStrategies() {
  const data = await fetchWithRetry("/api/proxy/pools");
  if (!data || !data.data) return [];

  return data.data
    .filter((p: any) => p.tvlUsd > 1000000 && p.apy > 0 && p.apy < 1000)
    .map((p: any) => ({
      ...p,
      displaySymbol: p.symbol,
      type: detectType(p.project, p.category),
      risk: detectRisk(p),
      isOfficial: ["Lido", "AAVE", "MakerDAO", "Uniswap", "Curve", "Rocket Pool"].includes(p.project)
    }))
    .sort((a: any, b: any) => b.tvlUsd - a.tvlUsd) 
    .slice(0, 300);
}

// --- AQUÍ ESTABA EL ERROR DEL SIGNAL LOST (LO MANTENEMOS IGUAL) ---
export async function getStrategyMetadata(poolId: string) {
  const data = await fetchWithRetry("/api/proxy/pools");
  
  if (!data || !data.data) {
      console.warn(`Pool list unavailable.`);
      return null;
  }

  const foundPool = data.data.find((p: any) => p.pool === poolId);

  if (!foundPool) {
      console.warn(`Pool ${poolId} not found in master list.`);
      return null;
  }

  return {
      ...foundPool,
      risk: detectRisk(foundPool)
  };
}

export async function getStrategyHistory(poolId: string) {
  const data = await fetchWithRetry(`/api/proxy/chart/${poolId}`);
  
  if (Array.isArray(data)) {
      return data.map((item: any) => ({
          date: new Date(item.timestamp).getTime() / 1000, 
          apy: item.apy,
          tvlUsd: item.tvl
      }));
  } else if (data && data.data && Array.isArray(data.data)) {
      return data.data;
  }
  return [];
}

// --- PROTOCOLS INTELLIGENCE ---
export async function getProtocolIntel() {
  const data = await fetchWithRetry("/api/proxy/general/protocols");
  
  if (!Array.isArray(data)) return [];

  return data
    .filter((p: any) => p.tvl > 5000000) 
    .map((p: any) => ({
        id: p.id,
        name: p.name,
        symbol: p.symbol,
        logo: p.logo,
        url: p.url,
        category: p.category,
        chains: p.chains || [],
        tvl: p.tvl,
        change_1d: p.change_1d, 
        change_7d: p.change_7d, 
        mcap: p.mcap,
        audit_count: p.audits ? parseInt(p.audits) : 0, 
        audits: p.audits, 
        twitter: p.twitter,
    }))
    .sort((a: any, b: any) => b.tvl - a.tvl)
    .slice(0, 50); 
}

// --- MARKET PULSE (LA FUNCIÓN QUE FALTABA) ---
// Esta es la que arregla el error de pantalla roja en /market
export async function getChainStats() {
    const data = await fetchWithRetry("/api/proxy/general/v2/chains");
    
    if (!Array.isArray(data)) return [];

    return data
        .map((chain: any) => ({
            name: chain.name,
            tvl: chain.tvl,
            token: chain.tokenSymbol,
        }))
        .sort((a: any, b: any) => b.tvl - a.tvl)
        .slice(0, 15); 
}
// --- 6. CAPITAL & SENTIMENT (NUEVO) ---

export async function getFearAndGreed() {
    // API Real gratuita de Alternative.me
    try {
        const res = await fetch("https://api.alternative.me/fng/");
        const data = await res.json();
        return data.data[0];
    } catch (e) {
        return { value: 50, value_classification: "Neutral" };
    }
}

export async function getCapitalMetrics() {
    // Simulamos datos complejos (Whales, ETF, Liquidations)
    // En producción, conectarías esto a Glassnode/Dune Analytics
    return {
        btc_etf: [
            { day: 'Mon', flow: 120 }, { day: 'Tue', flow: -45 }, { day: 'Wed', flow: 230 }, { day: 'Thu', flow: 500 }, { day: 'Fri', flow: 150 }, { day: 'Sat', flow: 0 }, { day: 'Sun', flow: 0 }
        ],
        eth_staking: [
            { date: 'W1', in: 5000, out: 2000 }, { date: 'W2', in: 7000, out: 1500 }, { date: 'W3', in: 4000, out: 3000 }, { date: 'W4', in: 8000, out: 1000 }
        ],
        distribution: [
            { name: 'Whales (>1k BTC)', value: 42, fill: '#f97316' }, // Orange
            { name: 'Institutions', value: 28, fill: '#3b82f6' },     // Blue
            { name: 'Retail', value: 30, fill: '#10b981' }            // Emerald
        ],
        liquidations: Array.from({ length: 20 }, (_, i) => ({
            price: 58000 + (i * 500),
            vol: Math.floor(Math.random() * 100) + 20, // Volumen simulado
            leverage: i % 2 === 0 ? '50x' : '100x'
        }))
    };
}