# Pages, Payouts & KYC Launch Refinement Report

**Date:** July 10, 2026  
**Scope:** V1 launch UX — bank-only funding/payouts, KYC hidden, admin feature flags

---

## 1. KYC Removed from User Experience

| Removed | Location |
|---------|----------|
| `KycSection` component usage | Profile page |
| KYC status badge on profile | Profile header |
| “Complete KYC to unlock payouts” messaging | User-facing copy |
| KYC from package access steps | `content/packages.ts` (replaced with wallet funding) |
| KYC gate blocking payouts | Disabled via `kyc_required: false` feature flag (default) |

**Retained (backend/admin only):** `/api/kyc`, `/api/uploads/kyc-document`, `/api/admin/kyc/[userId]`, admin KYC review, legal `/legal/kyc` policy page.

---

## 2. Crypto Removed from User Experience

| Removed from UI | Notes |
|-----------------|-------|
| Crypto wallets panel | Deposits page — bank only |
| Cryptocurrency payment method | Funding form |
| USDT / USDC / BTC payout selector | Payout form — bank only |
| Crypto copy in marketing | `site.ts`, `HomePage.tsx` |
| Crypto API error messages | Payment init/verify routes |

**Retained:** `CryptoWalletsPanel`, `PayoutMethodSelector`, crypto types in `lib/payments.ts`, `getCryptoWallets()` — available when admin enables flags.

---

## 3. Admin Crypto Feature Toggles Added

**Settings key:** `feature_flags` in `settings` table

| Flag | Default |
|------|---------|
| `kyc_required` | OFF |
| `enable_usdt` | OFF |
| `enable_usdc` | OFF |
| `enable_bitcoin` | OFF |
| `enable_crypto_funding` | OFF |
| `enable_crypto_payouts` | OFF |

**Admin UI:** `/admin#feature-flags` — `AdminFeatureFlags` component  
**API:** `GET/POST /api/admin/feature-flags`

---

## 4. Funding Page Improvements

**Route:** `/deposits` — **Wallet funding**

- Balance strip: current, available, pending funding
- Full-width bank details with copy buttons
- Simplified reference submission form (bank transfer only)
- Funding instructions sidebar
- **Funding history** table (recent submissions)
- CTA: Explore investment packages

---

## 5. Payout Page Improvements

- **Bank-only** payout form with premium card layout
- Saved accounts from `/api/bank-accounts` (server-persisted)
- Add new account + optional save for future
- Clear processing window messaging
- Payout history with search/filter (unchanged)
- Dashboard metrics: available, pending, recent, total paid out

---

## 6. Dashboard Improvements

- Cooperative → investment settlement wording
- Nav: **Wallet funding** label
- Quick actions aligned to launch flow (fund → invest → portfolio → payout)

---

## 7. Content Refinements

- Bank-only funding language across site hero and value props
- Removed crypto/KYC from member journey copy
- Package access steps: fund wallet first
- Learn page: registration → funding flow (no KYC step)
- Profile: clean account shortcuts without verification widgets

---

## 8. UX Improvements

- Consistent “Wallet funding” / “Payout” terminology
- No empty KYC placeholders on profile
- Payout form feels like digital banking (saved accounts, clear fields)
- Funding page complete end-to-end with history
- Launch-ready defaults — payouts work without KYC

---

## 9. Remaining Recommendations

1. **Wire crypto UI to feature flags** — conditionally render `CryptoWalletsPanel` and crypto payout selector when admin toggles ON
2. **Wire KYC UI to `kyc_required` flag** — reintroduce profile KYC section only when flag enabled
3. **Save payout windows** from admin bank settings form (field present, handler can be extended)
4. **Elite tier plans** in DB for full package invest flow
5. **Onboarding checklist** on dashboard guiding: Fund → Invest → Track (optional V1.1)

---

## Build Status

`npm run build` — **passes** ✓
