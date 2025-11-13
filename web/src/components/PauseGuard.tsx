// web/src/components/PauseGuard.tsx
import React from "react";

export function PauseBanner({
  paused,
  onRefresh,
}: { paused: boolean; onRefresh?: () => void }) {
  if (!paused) return null;
  return (
    <div className="ge-banner ge-banner-paused">
      <div>
        <strong>Protocol paused</strong> — admin Safe detuvo operaciones
        temporalmente. No se pueden ejecutar depósitos, préstamos ni retiros.
      </div>
      <button className="ge-banner-btn" onClick={onRefresh}>Refresh</button>
    </div>
  );
}

export function PauseGuard({
  paused,
  children,
}: { paused: boolean; children: React.ReactNode }) {
  return <div className={paused ? "ge-disabled" : ""}>{children}</div>;
}
