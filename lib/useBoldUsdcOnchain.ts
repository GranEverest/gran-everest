// lib/useBoldUsdcOnchain.ts
"use client";

import { useEffect, useMemo, useState } from "react";

//
// Constantes leídas de .env.local
//

// Pair / LP de BOLD/USDC en Aerodrome
export const BOLD_USDC_LP =
  process.env.NEXT_PUBLIC_BOLD_USDC_LP as `0x${string}`;

// Gauge donde se stakea la LP
export const BOLD_USDC_GAUGE =
  process.env.NEXT_PUBLIC_BOLD_USDC_GAUGE as `0x${string}`;

// Token AERO en Base
export const AERO_TOKEN =
  process.env.NEXT_PUBLIC_AERO_TOKEN as `0x${string}`;

// Pool id de DefiLlama (string plano)
export const BOLD_USDC_LLAMA_POOL_ID =
  process.env.NEXT_PUBLIC_BOLD_USDC_LLAMA_POOL_ID ?? "";

// Vault GranBoldUsdcVault en Base
export const BOLD_USDC_VAULT_ADDRESS =
  process.env.NEXT_PUBLIC_BOLD_USDC_VAULT_ADDRESS as `0x${string}`;

if (!BOLD_USDC_VAULT_ADDRESS) {
  throw new Error("Missing NEXT_PUBLIC_BOLD_USDC_VAULT_ADDRESS");
}

type Args = {
  baseline: number | null;
};

type Result = {
  apy: number;                     // 0.065 => 6.5 % anual
  daysSinceBaseline: number | null;
  expectedValue: number | null;    // valor esperado hoy de esa baseline
};

const APY = 0.065; // 6.5 % anual (ajustable)
const BASELINE_TS_KEY = "ge-autopilot-bold-usdc-baseline-ts";

export function useBoldUsdcOnchain({ baseline }: Args): Result {
  const [baselineTs, setBaselineTs] = useState<number | null>(null);

  // Cargar timestamp guardado (si existe)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(BASELINE_TS_KEY);
    if (!raw) return;
    const ts = Number(raw);
    if (Number.isFinite(ts)) {
      setBaselineTs(ts);
    }
  }, []);

  // Cada vez que cambia la baseline, reseteamos el timestamp a "ahora"
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (baseline == null) {
      window.localStorage.removeItem(BASELINE_TS_KEY);
      setBaselineTs(null);
      return;
    }

    const now = Date.now();
    setBaselineTs(now);
    window.localStorage.setItem(BASELINE_TS_KEY, String(now));
  }, [baseline]);

  const daysSinceBaseline = useMemo(() => {
    if (baselineTs == null) return null;
    const now = Date.now();
    if (now <= baselineTs) return 0;
    const diffMs = now - baselineTs;
    return diffMs / (1000 * 60 * 60 * 24); // ms → días
  }, [baselineTs]);

  const expectedValue = useMemo(() => {
    if (baseline == null || daysSinceBaseline == null) return null;
    // Interés simple: baseline * (1 + APY * días/365)
    const value = baseline * (1 + APY * (daysSinceBaseline / 365));
    return Number(value.toFixed(2));
  }, [baseline, daysSinceBaseline]);

  return {
    apy: APY,
    daysSinceBaseline,
    expectedValue,
  };
}
