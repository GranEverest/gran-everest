// web/src/hooks/useVaultStatus.ts
import { useEffect, useMemo, useState, useCallback } from "react";
import { createPublicClient, http } from "viem";
import type { Abi } from "viem";
import { base } from "viem/chains";
import EverestVault from "@/abi/EverestVault.json";

type HexAddress = `0x${string}`;

// Robusto: acepta ABI como array directo o como { abi: [...] }
const ABI: Abi = ((EverestVault as any)?.abi ?? EverestVault) as Abi;

const RPC = process.env.NEXT_PUBLIC_RPC_URL || "https://mainnet.base.org";

export function useVaultStatus(vaultAddress: HexAddress) {
  const [paused, setPaused] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const client = useMemo(
    () =>
      createPublicClient({
        chain: base,
        transport: http(RPC),
      }),
    []
  );

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const p = (await client.readContract({
        address: vaultAddress,
        abi: ABI,
        functionName: "paused",
      })) as boolean;
      setPaused(Boolean(p));
    } finally {
      setLoading(false);
    }
  }, [client, vaultAddress]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 12_000); // poll cada 12s
    return () => clearInterval(id);
  }, [refresh]);

  return { paused, loading, refresh };
}
