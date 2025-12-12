// lib/useBoldUsdcPosition.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useBalance, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import {
  USDC_ADDRESS,
  AERODROME_BOLD_USDC_LP,
  AERODROME_BOLD_USDC_GAUGE,
  DEFILLAMA_BOLD_USDC_POOL_ID,
  pairAbi,
  gaugeAbi,
} from "./aeroBoldUsdc";

type Result = {
  loading: boolean;
  error?: string;
  walletUsdc: number;        // USDC libre en wallet
  lpWallet: number;          // LP en la wallet
  lpStaked: number;          // LP staked en gauge
  lpTotal: number;           // LP totales (wallet + gauge)
  positionUsdc: number;      // Valor estimado de la posición BOLD/USDC en USDC
  pendingAero: number;       // Rewards AERO pendientes (en tokens)
  poolApy: number | null;    // APY actual de la pool según DefiLlama
};

export function useBoldUsdcPosition(): Result {
  const { address } = useAccount();

  const [poolApy, setPoolApy] = useState<number | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);

  const hasPoolConfig = !!AERODROME_BOLD_USDC_LP && !!AERODROME_BOLD_USDC_GAUGE;

  // ===== USDC libre en wallet =====
  const {
    data: usdcBalance,
    isLoading: loadingUsdcRaw,
  } = useBalance({
    address,
    token: USDC_ADDRESS,
    query: {
      enabled: !!address,
      refetchInterval: 15_000,
    },
  });

  // ===== Lecturas del pool + gauge =====
  const { data: contractsData, isLoading: loadingContracts } = useReadContracts({
    contracts:
      address && hasPoolConfig
        ? [
            // totalSupply LP
            {
              address: AERODROME_BOLD_USDC_LP!,
              abi: pairAbi,
              functionName: "totalSupply",
            },
            // reserves
            {
              address: AERODROME_BOLD_USDC_LP!,
              abi: pairAbi,
              functionName: "getReserves",
            },
            // token0
            {
              address: AERODROME_BOLD_USDC_LP!,
              abi: pairAbi,
              functionName: "token0",
            },
            // token1
            {
              address: AERODROME_BOLD_USDC_LP!,
              abi: pairAbi,
              functionName: "token1",
            },
            // LP en wallet
            {
              address: AERODROME_BOLD_USDC_LP!,
              abi: pairAbi,
              functionName: "balanceOf",
              args: [address],
            },
            // LP staked en gauge
            {
              address: AERODROME_BOLD_USDC_GAUGE!,
              abi: gaugeAbi,
              functionName: "balanceOf",
              args: [address],
            },
            // Rewards AERO pendientes
            {
              address: AERODROME_BOLD_USDC_GAUGE!,
              abi: gaugeAbi,
              functionName: "earned",
              args: [address],
            },
          ]
        : [],
    query: {
      enabled: !!address && hasPoolConfig,
      refetchInterval: 30_000,
    },
  });

  const loading = loadingUsdcRaw || loadingContracts;

  // ===== Cálculos en USDC =====
  const {
    walletUsdc,
    lpWallet,
    lpStaked,
    lpTotal,
    positionUsdc,
    pendingAero,
  } = useMemo(() => {
    const base = {
      walletUsdc: 0,
      lpWallet: 0,
      lpStaked: 0,
      lpTotal: 0,
      positionUsdc: 0,
      pendingAero: 0,
    };

    if (!address) return base;

    // USDC libre en wallet
    const walletUsdcNumber =
      usdcBalance && usdcBalance.value
        ? Number(formatUnits(usdcBalance.value, usdcBalance.decimals))
        : 0;

    if (!hasPoolConfig || !contractsData || contractsData.length < 7) {
      return {
        ...base,
        walletUsdc: walletUsdcNumber,
      };
    }

    const [
      totalSupplyResult,
      reservesResult,
      token0Result,
      token1Result,
      walletLpResult,
      gaugeBalanceResult,
      earnedResult,
    ] = contractsData as any[];

    if (
      totalSupplyResult.status !== "success" ||
      reservesResult.status !== "success" ||
      token0Result.status !== "success" ||
      token1Result.status !== "success"
    ) {
      return {
        ...base,
        walletUsdc: walletUsdcNumber,
      };
    }

    const totalSupply = totalSupplyResult.result as bigint;
    const [reserve0Raw, reserve1Raw] = reservesResult.result as [
      bigint,
      bigint,
      bigint
    ];
    const token0 = token0Result.result as `0x${string}`;
    const token1 = token1Result.result as `0x${string}`;

    const walletLpBig =
      walletLpResult?.status === "success"
        ? ((walletLpResult.result as bigint) ?? 0n)
        : 0n;

    const gaugeLpBig =
      gaugeBalanceResult?.status === "success"
        ? ((gaugeBalanceResult.result as bigint) ?? 0n)
        : 0n;

    const earnedBig =
      earnedResult?.status === "success"
        ? ((earnedResult.result as bigint) ?? 0n)
        : 0n;

    const lpTotalBig = walletLpBig + gaugeLpBig;

    // Elegir el reserve que es USDC según token0/token1
    let reserveUsdcBig: bigint = 0n;
    if (token0.toLowerCase() === USDC_ADDRESS.toLowerCase()) {
      reserveUsdcBig = reserve0Raw;
    } else if (token1.toLowerCase() === USDC_ADDRESS.toLowerCase()) {
      reserveUsdcBig = reserve1Raw;
    }

    let positionUsdcNumber = 0;

    try {
      if (lpTotalBig > 0n && totalSupply > 0n && reserveUsdcBig > 0n) {
        const usdcReserveFloat = Number(formatUnits(reserveUsdcBig, 6)); // USDC = 6 decimales
        const poolUsdcValue = usdcReserveFloat * 2; // BOLD/USDC -> valor total ≈ 2 * lado USDC

        const lpSupplyFloat = Number(formatUnits(totalSupply, 18)); // LP suele ser 18 decimales
        const lpPriceUsdc =
          lpSupplyFloat > 0 ? poolUsdcValue / lpSupplyFloat : 0;

        const lpUserFloat = Number(formatUnits(lpTotalBig, 18));
        positionUsdcNumber = lpUserFloat * lpPriceUsdc;
      }
    } catch {
      // si algo explota, devolvemos 0 y listo
      positionUsdcNumber = 0;
    }

    return {
      walletUsdc: walletUsdcNumber,
      lpWallet: Number(formatUnits(walletLpBig, 18)),
      lpStaked: Number(formatUnits(gaugeLpBig, 18)),
      lpTotal: Number(formatUnits(lpTotalBig, 18)),
      positionUsdc: positionUsdcNumber,
      pendingAero: Number(formatUnits(earnedBig, 18)), // AERO suele ser 18 dec
    };
  }, [address, hasPoolConfig, contractsData, usdcBalance]);

  // ===== APY desde DefiLlama =====
  useEffect(() => {
    if (!DEFILLAMA_BOLD_USDC_POOL_ID) return;

    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("https://pro-api.llama.fi/yields/pools");
        if (!res.ok) return;

        const json = (await res.json()) as {
          status: string;
          data: any[];
        };

        const pool = json.data.find(
          (p) => p.pool === DEFILLAMA_BOLD_USDC_POOL_ID
        );

        if (!pool) return;

        if (!cancelled) {
          const apy = typeof pool.apy === "number" ? pool.apy : null;
          setPoolApy(apy);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Error al leer APY de DefiLlama (revisá el poolId o la URL)");
        }
      }
    }

    load();
    const id = setInterval(load, 60_000); // refresco cada 60s

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return {
    loading,
    error,
    walletUsdc,
    lpWallet,
    lpStaked,
    lpTotal,
    positionUsdc,
    pendingAero,
    poolApy,
  };
}
