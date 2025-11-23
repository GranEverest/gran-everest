# Security notes

## Slither run (EverestVault / EverestVaultMulti)

- Date: 2025-11-23  
- Command:  
  `slither . --filter-paths "node_modules|artifacts|cache|src/mocks"`

### Results

- No critical issues found.
- Expected warnings:
  - “Dangerous strict equality” in `EverestVault.deposit` used for the same-block anti-loop guard.
  - Low-level calls (`.call{value: ...}()`) with `ok` checks in `_safeSendETH` and EverestVaultMulti flows.
  - Naming style only (`_guardian`, `_feeRecipient`, `GE_Timelock` not following standard naming conventions).
