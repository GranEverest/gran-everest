# GranEverest

Monorepo for the GranEverest project:

- ETH borrowing vault on **Base mainnet** (EverestVault).
- Static web app exported from Next.js and deployed to Hostinger
  from `gran-repo/public_html`.

---

## Live contracts (Base mainnet)

- **Production vault (single-vault, EverestVault)**  
  `0xA3F0e117F200763b7FA37250BFF63CBF690364B4`

- **Multi-vault experiment (EverestVaultMulti)**  
  `0x8A83E4349f4bd053cef3083F4219628957f54725`  
  (research / next version – not used by the production UI yet)

- **Owner / guardian / feeRecipient**  
  `0xF5e97BAc061FA8572b55cD7969452f9492448Be1`

- **Parameters (shared by both vault models)**  
  - Max LTV: **70%** of collateral value  
  - Protocol fee: **0.25%** on `deposit` and `withdraw` only  
  - `borrow` and `repay` have **no protocol fee** (gas only)  
  - Anti-loop same-block guard on `borrow`/`deposit`  
  - `pause()` blocks `deposit / borrow / withdraw` but keeps `repay` allowed

For more operational details see:

- `web/app/trust/page.tsx`
- Internal runbooks and analysis reports (kept in a private repository)

---

## Branches

- **main**  
  Stable snapshot that gets exported to static files under
  `gran-repo/public_html/` for Hostinger.

- **wip/***  
  Work-in-progress branches for `contracts` and `web` (feature branches / PRs)
  that eventually get merged into `main`.

---

## Repository structure

- `contracts/`  
  Smart contracts and test suites for the vaults  
  (EverestVault / EverestVaultMulti).  
  → See `contracts/README.md` for full technical documentation
  (tests, Slither, Foundry).

- `web/`  
  Next.js app (landing page, `/borrow`, `/trust`, `/docs`).  
  Exported as a static site and deployed into `gran-repo/public_html/`.

- `gran-repo/public_html/`  
  Static output that is uploaded to Hostinger  
  (includes `/`, `/borrow/`, `/trust/`, assets, etc.).

---

## Environment & security

- `.env` files and keys are **never** committed.
- Use:
  - `./contracts/.env.example`
  - `./web/.env.local.example`
  as templates.
- Real secrets live only in:
  - Local `.env` files (ignored by git).
  - Hardware wallets / password managers.

**Frontend env (example):**

```dotenv
# web/.env.local (local only, not committed)

NEXT_PUBLIC_CHAIN=base
NEXT_PUBLIC_RPC_URL=https://mainnet.base.org

# Production vault used by the app
NEXT_PUBLIC_VAULT_ADDRESS=0xA3F0e117F200763b7FA37250BFF63CBF690364B4

# Optional: multi-vault experiment + testnet
NEXT_PUBLIC_VAULT_MULTI_ADDRESS=0x8A83E4349f4bd053cef3083F4219628957f54725
NEXT_PUBLIC_VAULT_MULTI_ADDRESS_TESTNET=0x114c4133a937C3e3A871Ce53B5Ff9975A96AA295
