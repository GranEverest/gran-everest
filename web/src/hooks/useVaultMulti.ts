// web/src/hooks/useVaultMulti.ts
"use client";

/**
 * Stub temporal.
 * El UI actual no usa multi-vault, así que dejamos este hook
 * como placeholder solo para que TypeScript compile.
 */

export type VaultView = {
  vaultId: number;
  name: string;
};

export function useVaultMulti(): never {
  throw new Error("useVaultMulti is disabled in this build.");
}
