// web/app/borrow/page.tsx
"use client";

import dynamic from "next/dynamic";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { config } from "@/wagmi";

// Cargamos el cliente de /borrow de forma dinámica (sin SSR)
const BorrowClient = dynamic(() => import("./BorrowClient"), {
  ssr: false,
});

// Un solo QueryClient para toda la app de borrow
const queryClient = new QueryClient();

export default function BorrowPage() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <BorrowClient />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
