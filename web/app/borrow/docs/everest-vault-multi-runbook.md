# EverestVaultMulti — Runbook de operador

## 1. Datos fijos

- Red: Base mainnet (chainId 8453)
- Contrato single-vault (legacy BAU): `0xA3F0e117F200763b7FA37250BFF63CBF690364B4`
- Contrato multi-vault: `0x8A83E4349f4bd053cef3083F4219628957f54725`
- Owner (y feeRecipient): `0xF5e97BAc061FA8572b55cD7969452f9492448Be1` (Trezor)
- LTV máx: 70%
- Fee: 0.25% en `deposit` y `withdraw`
- Sin fee en `borrow` ni `repay`

## 2. Pausar en emergencia

1. Ir a BaseScan:
   - EverestVaultMulti: buscar `0x8A83E4349f4bd053cef3083F4219628957f54725`
2. Pestaña **Contract** → **Write Contract**.
3. Conectar wallet (Trezor) en red **Base**.
4. Buscar función `pause()`.
5. Ejecutar `pause()` y firmar.

Efecto:
- `deposit`, `borrow`, `withdraw` quedan bloqueados.
- `repay` sigue funcionando.

## 3. Reanudar (unpause)

1. Misma pantalla (**Write Contract**).
2. Función `unpause()`.
3. Ejecutar y firmar.

Efecto:
- `deposit`, `borrow`, `withdraw` vuelven a estar habilitados.

## 4. Checks rápidos de salud

En pestaña **Read Contract** de EverestVaultMulti:

- `totalCollateral()` → colateral total en wei.
- `totalDebt()` → deuda total en wei.
- `vaultCountOf(user)` → cantidad de vaults de un address.
- `getVault(user, vaultId)` → `(collateral, debt)` de un vault.

Invariantes:
- `totalCollateral` ≥ suma de todos los `collateral` de usuarios.
- `totalDebt` ≥ suma de todos los `debt` de usuarios.
- Para cada vault válido: `debt <= maxBorrowable(collateral)`.

## 5. Interacción manual si la web se rompe

Desde **Write Contract** de EverestVaultMulti:

- Crear vault vacío:
  - `createVault()`
- Depositar:
  - `deposit(vaultId)` con `msg.value` > 0
- Pedir prestado:
  - `borrow(vaultId, amount)` → amount en wei
- Repagar:
  - `repay(vaultId)` con `msg.value` = monto a repagar
- Retirar colateral:
  - `withdraw(vaultId, collateralAmount)` → amount en wei

Regla:
- Para vaciar un vault, primero `repay` toda la deuda, después `withdraw` todo el colateral.
