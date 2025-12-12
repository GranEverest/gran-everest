// components/ConnectWalletButton.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { base } from "wagmi/chains";

function ConnectWalletButtonInner() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { address, status } = useAccount();
  const { connect, connectors, status: connectStatus } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, status: switchStatus } = useSwitchChain();

  const isConnecting =
    connectStatus === "pending" || status === "connecting";
  const isOnBase = chainId === base.id;

  const shortAddress = useMemo(() => {
    if (!address) return "";
    return `${address.slice(0, 6)}…${address.slice(-4)}`;
  }, [address]);

  if (!mounted) return null;

  // No conectado
  if (!address) {
    const primary = connectors[0];

    return (
      <button
        type="button"
        onClick={() => connect({ connector: primary })}
        disabled={isConnecting}
        className="text-xs px-3 py-1.5 rounded-md border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50"
      >
        {isConnecting ? "Connecting…" : "Connect wallet"}
      </button>
    );
  }

  // Conectado pero en red equivocada
  if (address && !isOnBase) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-amber-400 hidden sm:inline">
          Wrong network
        </span>
        <button
          type="button"
          onClick={() => switchChain({ chainId: base.id })}
          disabled={switchStatus === "pending"}
          className="text-xs px-3 py-1.5 rounded-md border border-amber-500/80 bg-amber-900/30 hover:bg-amber-900/60 disabled:opacity-50"
        >
          {switchStatus === "pending" ? "Switching…" : "Switch to Base"}
        </button>
        <button
          type="button"
          onClick={() => disconnect()}
          className="text-[11px] px-2 py-1 rounded-md border border-neutral-700 bg-neutral-900 hover:bg-neutral-800"
        >
          {shortAddress}
        </button>
      </div>
    );
  }

  // Conectado y en Base
  return (
    <button
      type="button"
      onClick={() => disconnect()}
      className="text-xs px-3 py-1.5 rounded-md border border-neutral-700 bg-neutral-900 hover:bg-neutral-800"
      title="Disconnect"
    >
      {shortAddress}
    </button>
  );
}

// Default export para que el import del layout nunca quede undefined
export default function ConnectWalletButton() {
  return <ConnectWalletButtonInner />;
}
