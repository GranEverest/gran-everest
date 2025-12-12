// app/bold-usdc/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useBoldUsdcPosition } from "../../lib/useBoldUsdcPosition";

const BASELINE_STORAGE_KEY = "ge-autopilot-bold-usdc-baseline";
const BASELINE_TS_KEY = "ge-autopilot-bold-usdc-baseline-ts";

export default function BoldUsdcPage() {
  const { address } = useAccount();

  // ===== Guardia de montaje para evitar mismatches de hidratación =====
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // ===== Posición real en la estrategia BOLD/USDC =====
  const {
    loading: loadingPosition,
    error,
    walletUsdc,
    lpWallet,
    lpStaked,
    lpTotal,
    positionUsdc,
    pendingAero,
    poolApy,
  } = useBoldUsdcPosition();

  const loading = !mounted || loadingPosition;

  // ===== Tracking local de “baseline” (sobre la POSICIÓN en la pool) =====
  const [baseline, setBaseline] = useState<number | null>(null);
  const [baselineTs, setBaselineTs] = useState<number | null>(null);

  // Cargar baseline y timestamp desde localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const rawBaseline = window.localStorage.getItem(BASELINE_STORAGE_KEY);
    const rawTs = window.localStorage.getItem(BASELINE_TS_KEY);

    if (rawBaseline) {
      const parsed = Number(rawBaseline);
      if (Number.isFinite(parsed)) setBaseline(parsed);
    }

    if (rawTs) {
      const ts = Number(rawTs);
      if (Number.isFinite(ts)) setBaselineTs(ts);
    }
  }, []);

  // Guardar baseline + timestamp en localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (baseline == null || baselineTs == null) {
      window.localStorage.removeItem(BASELINE_STORAGE_KEY);
      window.localStorage.removeItem(BASELINE_TS_KEY);
      return;
    }

    window.localStorage.setItem(BASELINE_STORAGE_KEY, String(baseline));
    window.localStorage.setItem(BASELINE_TS_KEY, String(baselineTs));
  }, [baseline, baselineTs]);

  const currentValue = positionUsdc; // valor real de la posición en la pool

  const pnlAbs =
    baseline != null ? Number((currentValue - baseline).toFixed(2)) : 0;
  const pnlPct =
    baseline != null && baseline > 0
      ? Number(((pnlAbs / baseline) * 100).toFixed(2))
      : 0;

  function resetBaselineToCurrent() {
    if (!currentValue) return;
    const v = Number(currentValue.toFixed(2));
    setBaseline(v);
    setBaselineTs(Date.now());
  }

  // ===== Días desde que seteaste la baseline =====
  const daysSinceBaseline = useMemo(() => {
    if (baselineTs == null) return null;
    const now = Date.now();
    if (now <= baselineTs) return 0;
    const diffMs = now - baselineTs;
    return diffMs / (1000 * 60 * 60 * 24);
  }, [baselineTs]);

  // ===== Simulación local usando el APY de la pool (o 6.5% por defecto) =====
  const apyPct = poolApy ?? 6.5; // si no hay dato, asumimos 6.5% para la simulación
  const apyDecimal = apyPct / 100;

  const expectedValue =
    baseline != null && daysSinceBaseline != null
      ? Number(
          (
            baseline *
            (1 + apyDecimal * (daysSinceBaseline / 365))
          ).toFixed(2)
        )
      : null;

  const expectedGain: number | null =
    baseline != null && expectedValue != null
      ? Number((expectedValue - baseline).toFixed(2))
      : null;

  // ===== Form de monto (todavía sin TX on-chain) =====
  const [amount, setAmount] = useState<string>("");

  const walletShort = useMemo(() => {
    if (!mounted || !address) return "—";
    return `${address.slice(0, 6)}…${address.slice(-4)}`;
  }, [mounted, address]);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Estrategia BOLD/USDC
        </h1>
        <p className="text-xs text-neutral-400 max-w-2xl">
          “Cash-like con esteroides”: pool stable/stable BOLD/USDC en Aerodrome
          V1 (Base). Más rendimiento que parking sólo en USDC, con riesgo extra
          de BOLD y del AMM. Vos siempre depositás y retirás en USDC; el vault
          maneja la pool por dentro.
        </p>
      </header>

      <div className="space-y-4">
        {/* ===== Strategy overview ===== */}
        <div className="border border-neutral-800 rounded-xl bg-neutral-950/40 p-4 text-xs">
          <h2 className="text-sm font-medium mb-3">Strategy overview</h2>
          <ul className="space-y-1 text-neutral-300">
            <li>• Chain: Base</li>
            <li>• Protocolo: Aerodrome V1</li>
            <li>• Par subyacente: BOLD / USDC</li>
            <li>• TVL: &gt; 600k (aprox, según DeFiLlama)</li>
            <li>
              • APY pool (7d, DeFiLlama):{" "}
              {poolApy == null ? "…" : `~${poolApy.toFixed(2)}%`}
            </li>
            <li>
              • APR objetivo de la estrategia (estimado): ~
              {apyPct.toFixed(2)}%
            </li>
          </ul>
          <p className="mt-3 text-[11px] text-neutral-500">
            Yield expresado en APR/ APY, no garantizado. El rendimiento puede
            subir o bajar según volumen, incentivos y precio de BOLD. Tu
            dashboard muestra datos on-chain de tu posición y una estimación en
            USDC; el vault se encarga de la pool BOLD/USDC por dentro.
          </p>
          {error && (
            <p className="mt-2 text-[11px] text-red-400">
              {error}
            </p>
          )}
        </div>

        {/* ===== Your position ===== */}
        <div className="border border-neutral-800 rounded-xl bg-neutral-950/40 p-4 text-xs">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-medium">Your position</h2>
            <div className="text-[11px] text-neutral-500">
              Wallet: {walletShort}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Valor de la posición en la estrategia */}
            <div className="space-y-1">
              <div className="text-[11px] text-neutral-500">
                STRATEGY VALUE (EST.)
              </div>
              <div className="text-base font-semibold">
                {loading ? "…" : `${currentValue.toFixed(2)} USDC`}
              </div>
              <p className="text-[11px] text-neutral-500">
                Valor estimado de tu posición en la estrategia (LP en wallet +
                LP staked en el gauge), expresado en USDC.
              </p>
            </div>

            {/* PnL vs baseline */}
            <div className="space-y-1">
              <div className="text-[11px] text-neutral-500">
                PnL SINCE BASELINE
              </div>
              <div className="text-base font-semibold">
                {baseline == null
                  ? "—"
                  : `${pnlAbs >= 0 ? "+" : ""}${pnlAbs.toFixed(
                      2
                    )} USDC (${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%)`}
              </div>
              <p className="text-[11px] text-neutral-500">
                Diferencia entre el valor actual de tu posición y la baseline
                que definas abajo. Tracking local, sólo en este navegador.
              </p>

              {baseline != null &&
                expectedValue != null &&
                daysSinceBaseline != null &&
                expectedGain != null && (
                  <p className="mt-1 text-[11px] text-neutral-500">
                    Si la pool mantuviera constante ~
                    {apyPct.toFixed(1)}% APR, hoy el valor esperado de tu
                    baseline sería{" "}
                    <span className="text-neutral-200">
                      {expectedValue.toFixed(2)} USDC
                    </span>{" "}
                    ({expectedGain >= 0 ? "+" : ""}
                    {expectedGain.toFixed(2)} USDC frente a tu baseline, en{" "}
                    {daysSinceBaseline.toFixed(1)} días). Es sólo una
                    simulación local, no una garantía.
                  </p>
                )}
            </div>
          </div>

          {/* Métricas adicionales: wallet USDC, LP y AERO */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="text-[11px] text-neutral-500">
                WALLET USDC (FREE)
              </div>
              <div className="text-sm font-medium">
                {loading ? "…" : `${walletUsdc.toFixed(2)} USDC`}
              </div>
              <p className="text-[11px] text-neutral-500">
                USDC libre en tu wallet sobre Base (fuera de la estrategia).
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-neutral-500">
                LP TOKENS (TOTAL)
              </div>
              <div className="text-sm font-medium">
                {loading ? "…" : lpTotal.toFixed(4)}
              </div>
              <p className="text-[11px] text-neutral-500">
                LP BOLD/USDC totales (wallet + staked). Si es 0, no tenés
                posición activa en la estrategia.
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-neutral-500">
                PENDING AERO REWARDS
              </div>
              <div className="text-sm font-medium">
                {loading ? "…" : `${pendingAero.toFixed(4)} AERO`}
              </div>
              <p className="text-[11px] text-neutral-500">
                Rewards AERO pendientes en el gauge. El APY de la pool ya suele
                descontar estos incentivos en términos de USDC.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 items-center justify-between">
            <div className="text-[11px] text-neutral-500">
              Baseline actual:{" "}
              {baseline == null ? "no seteada" : `${baseline.toFixed(2)} USDC`}
            </div>
            <button
              type="button"
              onClick={resetBaselineToCurrent}
              disabled={loading || !currentValue}
              className="text-[11px] px-3 py-1 rounded-md border border-neutral-700 hover:bg-neutral-900 disabled:opacity-40"
            >
              Reset baseline to current position
            </button>
          </div>
        </div>

        {/* ===== Rewards / explicación ===== */}
        <div className="border border-neutral-800 rounded-xl bg-neutral-950/40 p-4 text-xs">
          <h2 className="text-sm font-medium mb-2">Rewards & APR</h2>
          <p className="text-[11px] text-neutral-500">
            La estrategia combina fees del pool BOLD/USDC + incentivos en AERO.
            El APR objetivo de la estrategia es ~
            {apyPct.toFixed(2)}% (estimado, simple, sin reinversión). El APY que
            ves arriba viene de DeFiLlama y ya intenta expresar todo en términos
            de USDC. Tus rewards AERO pendientes se ven arriba, pero el valor
            exacto en USDC depende del precio de AERO en cada momento.
          </p>
        </div>

        {/* ===== Acciones (MVP) ===== */}
        <div className="border border-neutral-800 rounded-xl bg-neutral-950/40 p-4 text-xs space-y-3">
          <h2 className="text-sm font-medium">Acciones (MVP)</h2>
          <p className="text-[11px] text-neutral-500">
            Por ahora sólo diseñamos la UX. En el siguiente paso conectamos el
            vault para entrar/salir de la estrategia directamente desde acá
            usando sólo USDC.
          </p>

          <div className="space-y-1">
            <label className="text-[11px] text-neutral-400">
              Monto en USDC a invertir
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded-md px-3 py-2 text-xs outline-none focus:border-neutral-500"
              placeholder="0.00"
            />
            <div className="text-[11px] text-neutral-500">
              Todo se expresa en USDC como unidad mental. Internamente el vault
              usa BOLD/USDC y AERO, pero vos sólo depositás y retirás USDC.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              className="text-xs px-3 py-2 rounded-md border border-neutral-700 bg-neutral-900 hover:bg-neutral-800"
              disabled
            >
              Depositar USDC en la estrategia
            </button>
            <button
              type="button"
              className="text-xs px-3 py-2 rounded-md border border-neutral-700 bg-neutral-900 hover:bg-neutral-800"
              disabled
            >
              Retirar a USDC
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
