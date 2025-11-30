// web/src/hooks/useVaultStatus.ts
"use client";

/**
 * Stub temporal para el sistema de estado del multi-vault.
 * No se usa en el UI actual; existe solo para que los imports compilen.
 */

export type SimpleVaultStatus = {
  vaultId: number;
  loading: boolean;
  error?: string;
};

export function useVaultStatus(): SimpleVaultStatus {
  return {
    vaultId: 0,
    loading: false,
    error: "useVaultStatus is disabled in this build.",
  };
}
