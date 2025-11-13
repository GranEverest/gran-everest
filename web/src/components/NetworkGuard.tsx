// web/src/components/NetworkGuard.tsx
import React from "react";

export function NetworkBanner({
  isOnBase,
  chainIdHex,
  onSwitch,
}: {
  isOnBase: boolean;
  chainIdHex: string | null;
  onSwitch: () => void;
}) {
  if (isOnBase) return null;
  return (
    <div className="ge-banner ge-banner-net">
      <div>
        <strong>Wrong network</strong> — please switch to <b>Base</b> to use the app.
        {chainIdHex ? <> (current: {chainIdHex})</> : null}
      </div>
      <button className="ge-banner-btn" onClick={onSwitch}>Switch to Base</button>
    </div>
  );
}

export function NetworkGuard({
  isOnBase,
  children,
}: {
  isOnBase: boolean;
  children: React.ReactNode;
}) {
  return <div className={isOnBase ? "" : "ge-disabled"}>{children}</div>;
}
