# GranEverest — Contracts

This folder contains the smart contracts and test suites for the GranEverest
vaults (EverestVault / EverestVaultMulti) deployed on Base.

- Solidity: `0.8.24`
- EVM: `paris`
- Hardhat: `2.26.x` (TypeScript)
- Foundry (forge): `1.4.4-stable`
- Static analysis: Slither (installed via `pipx`)
- Network: Base (mainnet) + Base Sepolia (testnet)

---

## Layout

- `src/`
  - `EverestVault.sol` — ETH vault used by the production app (Base).
  - `EverestVaultMulti.sol` — multi-vault variant used for research/tests.
  - `MockToken.sol` — ERC20 test token used in local testing.
  - `GE_Timelock.sol` — TimelockController used for governance experiments.
  - `LoopTester.sol` — helper used in fuzz/invariant testing.

- `test/` (Hardhat)
  - Unit tests for `EverestVault` / `EverestVaultMulti` and related helpers.

- `foundry-test/`
  - `EverestVaultMultiFuzz.t.sol` — Foundry fuzz tests for `EverestVaultMulti`
    (ETH-only vault model).

- `lib/forge-std/`
  - Foundry standard library (installed as a git submodule).

- `foundry.toml`
  - Foundry configuration (paths, remappings, cache).

- `docs/`
  - `everestvault-test-report-v2.pdf` — consolidated test & analysis report
    (Hardhat + Slither + Foundry fuzz).

---

## Requirements

- Node.js + npm
- Hardhat (`npx hardhat` is enough — locally installed as a dev dependency)
- Foundry (forge >= `1.4.x`)
- Slither (installed via `pipx`), for static analysis
- Access to Base / Base Sepolia RPC endpoints for deployment (set via `.env`)

> **Important:** `.env` files and private keys must never be committed.
> Keep them local (e.g. `.env`, password manager, hardware wallet).

---

## Install

From the repo root:

```bash
cd contracts
npm install
