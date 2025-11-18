import { createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

// 🔹 Config único de Wagmi para GranEverest
export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    // MetaMask, Rabby, OKX, etc. (cualquier wallet inyectada en el navegador)
    injected({ shimDisconnect: true }),
  ],
  transports: {
    [base.id]: http(),        // usa el RPC por defecto de la chain (Base mainnet)
    [baseSepolia.id]: http(), // Base Sepolia
  },
});
