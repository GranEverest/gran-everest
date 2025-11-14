# GranEverest — ETH Borrowing Vault on Base

GranEverest is a minimal, non-custodial borrowing app on the **Base** network.

- **Collateral:** ETH  
- **Borrow asset:** ETH  
- **Interest rate:** 0% (no ongoing interest)  
- **Fees:** 0.25% protocol fee on **deposit** and **withdraw** only  
- **Max LTV:** 70% (borrow limit = 70% of collateral value)  
- **Network:** Base (L2 on Ethereum)  
- **Design:** simple, black/white minimal UI, ASCII mountain branding  

> ⚠️ **Important:** This repository does **not** contain any private keys or secrets.  
> All sensitive configuration is loaded from local `.env` files which must never be committed.

---

## Repository structure

```txt
gran-everest/
├─ contracts/           # Hardhat (TypeScript) smart contracts
├─ web/                 # Next.js 14 frontend (App Router, static export)
└─ gran-repo/
   └─ public_html/      # Production static site (Hostinger), built from /web/out
---

ʐ7´
