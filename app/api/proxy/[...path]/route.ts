import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const pathname = url.pathname; 
  let externalPath = pathname.replace("/api/proxy/", "");

  // CORRECCIÓN DE PRECIOS
  if (externalPath.startsWith("prices/") && !externalPath.includes("current")) {
      externalPath = externalPath.replace("prices/", "prices/current/");
  }

  // ENRUTAMIENTO INTELIGENTE
  let baseUrl = "https://yields.llama.fi"; // Por defecto (Pools)

  if (externalPath.startsWith("prices")) {
    baseUrl = "https://coins.llama.fi";
  } 
  // NUEVO: Ruta para datos generales de protocolos (TVL, Mcap, Audits)
  else if (externalPath.startsWith("general")) {
    baseUrl = "https://api.llama.fi";
    externalPath = externalPath.replace("general/", ""); // Quitamos el prefijo interno
  }

  const targetUrl = `${baseUrl}/${externalPath}`;

  console.log(`[PROXY] ${pathname} -> ${targetUrl}`);

  try {
    const response = await fetch(targetUrl, {
      next: { revalidate: 300 }, // Cache de 5 min
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
        return NextResponse.json({ error: "API Error" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json({ error: "Proxy Error" }, { status: 500 });
  }
}