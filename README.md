# GranEverest

Monorepo for the GranEverest project (ETH vault on Base + static web app for Hostinger).

## Branches

- **main**  
  Stable snapshot that gets exported to static files under  
  `gran-repo/public_html/` for Hostinger.

- **wip/***  
  Work-in-progress branches for `contracts` and `web` (feature branches / PRs that
  get merged into `main`).

## Repository structure

- `contracts/`  
  Smart contracts and test suites for the vaults (EverestVault / EverestVaultMulti).  
  → See `contracts/README.md` for full technical documentation (tests, Slither, Foundry).

- `web/`  
  Next.js app (landing page, `/borrow`, `/trust`).  
  Exported as a static site and deployed to `gran-repo/public_html/`.

- `gran-repo/public_html/`  
  Static output ready to upload to Hostinger (includes `/`, `/borrow/`, `/trust/`, etc.).

## Security

- `.env` files and keys are **never** versioned.
- Use `./contracts/.env.example` and `./web/.env.example` as templates.
- Real secrets live only in:
  - Local `.env` files (ignored by git).
  - Hardware wallets / password managers.

## Static deploy (Hostinger)

1. Build the static site from the `web/` folder:

   ```bash
   cd web
   npm run build
