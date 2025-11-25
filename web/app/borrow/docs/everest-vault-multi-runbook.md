# EverestVaultMulti — Operator Runbook

## 1. Fixed data

- Network: Base mainnet (chainId 8453)
- Legacy single-vault (not used by the app anymore):  
  `0xA3F0e117F200763b7FA37250BFF63CBF690364B4`
- Active multi-vault (what the /borrow app uses):  
  `0x8A83E4349f4bd053cef3083F4219628957f54725`
- Owner (and feeRecipient):  
  `0xF5e97BAc061FA8572b55cD7969452f9492448Be1` (Trezor)
- Max LTV: 70%
- Protocol fee: **0.25% on `deposit` and `withdraw`**
- No fee on `borrow` or `repay`
- `feeRecipient` is **immutable** in this contract (to change it you must deploy a new vault)

> Operational rule: **Always operate on the multi-vault address  
> `0x8A83E4349f4bd053cef3083F4219628957f54725`**, unless you are explicitly doing legacy forensics on the old single-vault.

---

## 2. Emergency pause

Goal: stop new deposits/borrows/withdrawals while still allowing repayments.

1. Go to BaseScan:
   - Open the contract page for  
     `0x8A83E4349f4bd053cef3083F4219628957f54725`
2. Tab **Contract** → **Write Contract**.
3. Connect wallet (Trezor) on **Base mainnet**.
4. Find function `pause()`.
5. Call `pause()` and sign the transaction.

Effect:

- `deposit`, `borrow`, `withdraw` are blocked.
- `repay` keeps working (users can still reduce debt).

---

## 3. Resume (unpause)

When the situation is under control:

1. Same BaseScan page (**Write Contract** on the multi-vault).
2. Call `unpause()`.
3. Sign with the owner wallet.

Effect:

- `deposit`, `borrow`, `withdraw` become available again.

---

## 4. Quick health checks

On the **Read Contract** tab for the multi-vault (`0x8A83…`):

Useful views:

- `totalCollateral()` → total collateral (in wei).
- `totalDebt()` → total debt (in wei).
- `vaultCountOf(user)` → how many vaults a given address has.
- `getVault(user, vaultId)` → returns `(collateral, debt)` for that vault.
- `paused()` → contract pause status (`true` / `false`).
- `owner()` → current owner address (must match the Trezor).

Invariants (what should always hold):

- For every valid vault:  
  `debt <= maxBorrowable(collateral)` where  
  `maxBorrowable(collateral) = collateral * 7000 / 10000`.
- Global:
  - `totalCollateral` = sum of all vaults’ `collateral` (or very close, ignoring rounding).
  - `totalDebt` = sum of all vaults’ `debt`.

If any invariant is clearly broken → **pause**, investigate, and avoid touching state until understood.

---

## 5. Manual interaction if the web app is down

All of this is on **Write Contract** for the multi-vault.

### 5.1 Create an empty vault

- Function: `createVault()`
- `msg.sender` = user who will own the vault.
- Returns a `vaultId` (0, 1, 2, …).

> Note: users can create multiple vaults; vault IDs are per-user.

### 5.2 Deposit collateral

- Function: `deposit(vaultId)`
- Parameters:
  - `vaultId` → numeric ID of the vault (for that user).
- Transaction:
  - Send ETH as `msg.value` (> 0).
- Behaviour:
  - Fee = `0.25%` of `msg.value` goes to `feeRecipient`.
  - `msg.value - fee` is added as `collateral`.

### 5.3 Borrow

- Function: `borrow(vaultId, amount)`
- Parameters:
  - `vaultId`
  - `amount` → in wei (loan amount).
- Behaviour:
  - Increases `debt` of that vault.
  - Reverts if new LTV would exceed 70%.
  - Sends `amount` ETH to the caller.
  - Only one borrow per block per user (anti-loop guard).

### 5.4 Repay

- Function: `repay(vaultId)`
- Parameters:
  - `vaultId`
- Transaction:
  - Send ETH as `msg.value` = amount you want to repay.
- Behaviour:
  - Reduces `debt` of that vault.
  - If `msg.value > debt`, excess is refunded to the user.
  - No protocol fee on repay.

### 5.5 Withdraw collateral

- Function: `withdraw(vaultId, collateralAmount)`
- Parameters:
  - `vaultId`
  - `collateralAmount` → in wei (amount of collateral to remove).
- Behaviour:
  - Checks that resulting LTV stays ≤ 70%.
  - Fee = `0.25%` of `collateralAmount` to `feeRecipient`.
  - User receives `collateralAmount - fee` in ETH.

**Rule to fully empty a vault:**

1. First: `repay(vaultId)` until `debt = 0`.
2. Then: `withdraw(vaultId, collateralAmount)` with the full collateral amount.

---

## 6. Frontend binding (for reference)

Current expected environment for the dApp:

```dotenv
# web/.env.local

NEXT_PUBLIC_CHAIN=base
NEXT_PUBLIC_RPC_URL=https://mainnet.base.org

# Active multi-vault on Base mainnet
NEXT_PUBLIC_VAULT_ADDRESS=0x8A83E4349f4bd053cef3083F4219628957f54725

# Optional: Base Sepolia test address for local testing
# NEXT_PUBLIC_VAULT_ADDRESS_SEPOLIA=0x114c4133a937C3e3A871Ce53B5Ff9975A96AA295
