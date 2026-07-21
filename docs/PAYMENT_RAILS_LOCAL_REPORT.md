# Payment Rails — Local Implementation Report

**Status:** Migration applied to production Supabase (`zqnuvqfzdzoxkdmcijpp`). Code pending commit/deploy with this release.

## 1. Payment Rails architecture implemented

- Independent Bank + Crypto rails with separate deposit/withdrawal directions
- Defaults in `src/config/payment-rails.ts`
- Live ops state in `settings.payment_rails` (instant effect)
- Resolution via `PaymentRailsService` + pure helpers in `src/lib/payments/payment-rails.ts`
- Provider plug-in surface in `src/services/payments/providers/`

## 2. Configuration created

- Assets: USDT, USDC, BTC, ETH
- Networks: TRC20, ERC20, BEP20, POLYGON, BITCOIN
- Provider stubs: Paystack, Flutterwave, Monnify, Stripe, Coinbase, Binance Pay, NowPayments, Yellow Card
- Active providers: `manual_bank`, `manual_crypto`

## 3. Admin controls added

- `/admin-app/payment-rails` + nav item **Payment rails**
- Settings deep link card
- `GET/PATCH /api/admin/payment-rails` with audit (`settings.payment_rails_updated`)
- Syncs legacy feature flags + bank switchboard + crypto_wallets on save

## 4. User flows updated

- Deposits: `DepositRailsWorkspace` (bank / crypto / both / neither)
- Withdrawals: `WithdrawalWorkspace` gated by rails + crypto-only message
- Settings: bank accounts gated; `CryptoWalletsManager` for crypto destinations
- Public snapshot: `GET /api/payment-rails`

## 5. Validation improvements

- Deposit/withdrawal APIs call `assertDepositAllowed` / `assertWithdrawalAllowed`
- Crypto deposit requires asset + network + configured receive address
- Crypto withdrawal requires wallet address; bank account not required when bank rail is off
- Dynamic profile wallet save via `/api/member/crypto-wallets`

## 6. Notification updates

- `NotificationService.notifyEvent` adapts titles/bodies when `data.rail` or `data.method` is bank/crypto

## 7. Audit logging implemented

- Admin PATCH logs before/after + optional reason through `logAdminAction`

## 8. Future scalability improvements

- Provider registry for new processors without redesign
- Settlement router holds payouts when no withdrawal rail is open
- Prepared migration for first-class crypto wallet table + rail columns

## 9. Remaining manual review items

- **Approve then apply** `supabase/migrations/20260721220000_payment_rails_crypto_destinations.sql` when ready
- After migrate: switch member wallets from `notification_preferences` to `member_crypto_wallets`
- Configure real platform crypto receive addresses in Admin before enabling crypto deposits
- Wire live provider adapters (NowPayments etc.) when keys are available
- Pass `rail: "crypto"` into deposit/withdrawal notification call sites where not yet threaded
- Explicit approval required before commit / push / deploy

## Unit tests

`src/lib/payments/payment-rails.test.ts` — 5/5 passing (merge + routing matrix).
