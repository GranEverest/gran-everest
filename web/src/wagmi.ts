// web/src/wagmi.ts
"use client";

import { createConfig, createStorage, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

// --- Storage en memoria (NO usa localStorage, ni cookies, ni nada del navegador) ---
const memoryStore: Record<string, string> = {};

const memoryStorage = createStorage({
  storage: {
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(memoryStore, key)
        ? memoryStore[key]
        : null;
    },
    setItem(key: string, value: string) {
      memoryStore[key] = value;
    },
    removeItem(key: string) {
      delete memoryStore[key];
    },
  },
});

// --- WalletConnect projectId (opcional) ---
// Sacás este ID del panel de WalletConnect v2 y lo ponés en .env.local como
// NEXT_PUBLIC_WC_PROJECT_ID=xxxxx
const wcProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;

// Armamos lista de connectors dinámica (para no romper si falta el projectId)
const connectors = [
  // Cualquier wallet inyectada: MetaMask, Rabby, OKX, navegador de wallet, etc.
  injected({
    shimDisconnect: true,
  }),
  // WalletConnect solo si hay projectId configurado
  ...(wcProjectId
    ? [
        walletConnect({
          projectId: wcProjectId,
          metadata: {
            name: "GranEverest",
            description: "0% interest ETH vault on Base",
            url: "https://graneverest.com",
            icons: [
              "https://graneverest.com/assets/icon-180.png",
            ],
          },
          showQrModal: true,
        }),
      ]
    : []),
];

// --- Config único de wagmi para GranEverest ---
export const config = createConfig({
  // Soportamos Base mainnet y Base Sepolia
  chains: [base, baseSepolia],

  connectors,

  // RPCs por defecto de wagmi para cada chain
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },

  // Usamos storage en memoria para evitar bugs de Safari con localStorage
  storage: memoryStorage,
});

// (opcional pero recomendable para tipos fuertes de wagmi)
declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
