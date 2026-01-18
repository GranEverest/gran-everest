import { NextResponse } from 'next/server';
import Moralis from 'moralis';

// Iniciamos Moralis si no está activo
if (!Moralis.Core.isStarted) {
  Moralis.start({ apiKey: process.env.MORALIS_API_KEY });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');
  const chain = searchParams.get('chain'); 

  if (!address) return NextResponse.json({ error: 'Address required' }, { status: 400 });

  try {
    const response = await Moralis.EvmApi.token.getWalletTokenBalances({
      address,
      chain: chain || "0x1", 
    });

    const tokens = response.raw;

    // --- LISTA NEGRA (SPAM) ---
    const SCAM_KEYWORDS = [
      "visit", ".com", ".io", ".xyz", ".org", "claim", "reward", 
      "voucher", "telegram", "access", "http", "www", "free", "airdrop",
      "ducky", "cypher", "afterlight", "bitway", "clash royale", 
      "deepnode", "owito", "rubber", "chicken", "whale", 
      "thent", "zama", "minereum", "bestairdrop", "financial", 
      "assist", "connect", "gift", "access"
    ];

    const cleanTokens = tokens
      .filter((t) => {
        if (Number(t.balance) <= 0) return false;
        if (t.possible_spam) return false;

        const nameLower = t.name ? t.name.toLowerCase() : "";
        const symbolLower = t.symbol ? t.symbol.toLowerCase() : "";
        const isScamName = SCAM_KEYWORDS.some(word => nameLower.includes(word));
        const isScamSymbol = SCAM_KEYWORDS.some(word => symbolLower.includes(word));
        
        if (isScamName || isScamSymbol) return false;
        if (t.name && t.name.length > 30) return false; 

        return true; 
      })
      .map((t) => ({
        name: t.name,
        symbol: t.symbol,
        balance: (Number(t.balance) / 10 ** t.decimals).toFixed(4),
        decimals: t.decimals,
        contract: t.token_address,
        logo: t.logo || null,
        thumbnail: t.thumbnail || null,
        // AGREGADO: Intentamos pasar el valor en USD si Moralis lo tiene
        // @ts-ignore
        usd_value: t.usd_value || 0 
      }))
      .sort((a, b) => {
        if (a.logo && !b.logo) return -1;
        if (!a.logo && b.logo) return 1;
        return a.name.localeCompare(b.name);
      });

    return NextResponse.json({ tokens: cleanTokens });
  } catch (error) {
    console.error("Moralis Error:", error);
    return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
  }
}