// web/src/hooks/useSwap.ts
"use client";

import { useChainId, usePublicClient, useWalletClient } from "wagmi";

export type ReceiveAsset = "ETH" | "USDC" | "USDT" | "DAI";

const BASE_MAINNET_ID = 8453;

// Direcciones oficiales en Base mainnet (no toques esto para ahora)
const TOKENS_BASE_MAINNET: Record<Exclude<ReceiveAsset, "ETH">, `0x${string}`> =
  {
    USDC: "0x833589fCD6EDB6E08f4c7C32D4f71b54bdA02913",
    USDT: "0xFde4C96c8593536E31F229EA8f37B2ADa2699Bb2",
    DAI: "0x50C5725949A6F0C72E6C4A641F24049A917DB0Cb",
  };

export function useSwap() {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  async function swapEthForToken(params: {
    amountWei: bigint;
    asset: ReceiveAsset;
    taker: `0x${string}`;
  }) {
    if (!walletClient || !publicClient) {
      throw new Error("Wallet no disponible para swap");
    }

    // Sólo habilitado en Base mainnet
    if (chainId !== BASE_MAINNET_ID) {
      throw new Error("Swap sólo disponible en Base mainnet");
    }

    if (params.asset === "ETH") {
      // Nada que hacer, ya recibiste ETH.
      return;
    }

    const buyToken = TOKENS_BASE_MAINNET[params.asset];
    if (!buyToken) {
      throw new Error(`Asset ${params.asset} no soportado`);
    }

    const qs = new URLSearchParams({
      sellToken: "ETH",
      buyToken,
      sellAmount: params.amountWei.toString(), // en wei
      takerAddress: params.taker,
    });

    const url = `https://base.api.0x.org/swap/v1/quote?${qs.toString()}`;

    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`0x quote error: ${text}`);
    }

    const quote = await res.json();

    const hash = await walletClient.sendTransaction({
      account: params.taker,
      to: quote.to as `0x${string}`,
      data: quote.data as `0x${string}`,
      value: BigInt(quote.value ?? "0"),
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return receipt;
  }

  return { swapEthForToken };
}
