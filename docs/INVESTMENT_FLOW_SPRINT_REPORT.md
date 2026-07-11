# Investment Flow & Payout Refinement Sprint Report

**Date:** July 10, 2026  
**Scope:** UI/UX and content refinement — investment company positioning (not contribution platform)

---

## 1. Content Removed

| Removed item | Location |
|---|---|
| "Preferred Investment Package" label | `PackageSelectionField.tsx` |
| Package helper text ("Choose the plan that fits your goals…") | `PackageSelectionField.tsx` |
| Username helper text ("3–24 characters…") | `RegisterForm.tsx` |
| Fixed contribution tier buttons (₦3k, ₦6k, ₦12k, ₦25k, etc.) | Replaced in `InvestmentFundingForm.tsx` |
| "Member contribution" / "Choose a contribution tier" copy | `InvestmentFundingForm.tsx` |
| Paystack fund button & checkout UI | Deleted `PaystackFundButton.tsx` |
| Paystack payment verify banner | Deleted `PaymentVerifyBanner.tsx` |
| Paystack env vars & configuration warnings | `lib/env.ts`, `.env.local.example`, `deploy/env.production.example` |
| Paystack provider implementation | Deleted `paystack.client.ts`, `paystack.provider.ts` |
| Paystack initialize / webhook / verify flows | API routes return 410 with bank/crypto guidance |
| "Pay instantly with Paystack" and related deposit instructions | `deposits/page.tsx` |

---

## 2. Pages Updated

| Page / area | Changes |
|---|---|
| **Sign up** (`RegisterForm`, `PackageSelectionField`) | "Select Package", no helper text, clean minimal form |
| **Investment Funding** (`/deposits`) | Full restructure — bank panel, crypto panel, funding form, investment summary |
| **Payout** (`/withdrawals`) | Dashboard metrics, premium method selector, payout history with search/filter |
| **Dashboard** | "Pending payouts", "Request payout" quick action |
| **Wallet** | "Fund wallet", "Request payout" |
| **Nav** | Deposits → **Funding**, Withdrawals → **Payout** |
| **Settings / Profile** | Payout terminology in links and copy |
| **Notifications** | Funding & payout alert wording |
| **Admin** | Pending funding / pending payouts labels, export CSV labels |
| **Marketing** | `site.ts`, `HomePage`, `packages`, `learn` — investment/funding language |
| **Auth shell** | Verified investments, funding/payout windows |

---

## 3. Paystack References Removed

- UI components deleted
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` and `PAYSTACK_SECRET_KEY` removed from env schema and examples
- `isPaystackConfigured()` removed
- Payment service registers **bank_transfer only**
- `/api/payments/initialize`, `/api/payments/verify`, `/api/webhooks/paystack` return 410

**Note:** `database.ts` enum types still include `paystack` for historical rows — no schema migration required.

---

## 4. Crypto Support Added

### Funding (deposits)
- **USDT**, **USDC**, **BTC** wallet display via `CryptoWalletsPanel`
- Copy buttons on account numbers and wallet addresses
- `SettingsService.getCryptoWallets()` reads `crypto_wallets` settings key (configure in admin DB settings)
- Funding form payment method selector: Bank Transfer | Cryptocurrency

### Payouts
- Premium card selector: Bank, USDT, USDC, BTC
- Crypto wallet address fields with basic format validation
- Saved destinations in browser localStorage (device-only, no schema change)
- Crypto payouts map to existing `withdrawals` table: `bank_name` = asset, `account_number` = wallet address

---

## 5. Investment Terminology Updated

| Old | New |
|---|---|
| Contribution | Investment funding / wallet funding |
| Contribution tier | Funding amount (custom) |
| Member contribution | Investment funding |
| Deposits (nav) | Funding |
| Withdrawals | Payout |
| Withdraw | Request payout |
| Pending withdrawals | Pending payouts |

API error messages updated where user-facing (`deposits`, `withdrawals` routes). Internal DB field `contributions_enabled` retained (admin toggle) — UI shows "Wallet funding".

---

## 6. Funding Page Improvements

- Premium fintech layout with card hierarchy and icons
- **Payment Methods** section: Bank Transfer + Cryptocurrency side-by-side
- **Funding Form**: custom amount (min ₦1,000), payment method, reference, submit for verification
- **Investment Summary**: wallet balance, pending funding, available balance
- **Funding Tips** concise bullet list
- **Quick action**: Explore Investment Plans
- Light/dark theme compatible via existing design tokens

---

## 7. Payout Experience Improvements

- Page renamed in user flow to **Payout** / **Request a Payout**
- Dashboard strip: available balance, pending payouts, recent payout, total paid out
- Premium payout method cards (not plain radios)
- Bank: saved accounts + new account entry
- Crypto: USDT / USDC / BTC with validation
- Payout history table: reference, date, amount, method, status + search/filter
- Admin: approve/reject unchanged (backend preserved), labels updated to payouts

---

## 8. Remaining Wording Recommendations

1. **Configure crypto wallets in admin** — add `crypto_wallets` JSON to platform settings:
   ```json
   {
     "usdt": { "network": "TRC20", "address": "..." },
     "usdc": { "network": "ERC20", "address": "..." },
     "btc": { "address": "..." }
   }
   ```
2. **Rename `contributions_enabled`** setting key to `funding_enabled` in a future migration (UI already uses funding language).
3. **Legal pages** (`/legal/terms`, `/legal/risk`) still use "deposits and withdrawals" — update for full consistency.
4. **`learn.ts` educational copy** uses "contributions" in retirement/PFA context — intentional; not Alto Rich product language.
5. **Server-persisted payout destinations** — consider `bank_accounts` table extension for crypto addresses when schema changes are allowed.
6. **Receipt upload** — `/api/uploads/deposit-proof` exists; wire to funding form when ready.
7. **Route alias** — optional `/payout` → `/withdrawals` redirect for cleaner URLs.

---

## Files Created

- `src/lib/payments.ts`
- `src/components/ui/CopyButton.tsx`
- `src/components/funding/BankTransferPanel.tsx`
- `src/components/funding/CryptoWalletsPanel.tsx`
- `src/components/funding/InvestmentFundingForm.tsx`
- `src/components/payout/PayoutMethodSelector.tsx`
- `src/components/payout/PayoutRequestForm.tsx`
- `src/components/payout/PayoutHistoryTable.tsx`

## Build Status

`npm run build` — **passes** ✓
