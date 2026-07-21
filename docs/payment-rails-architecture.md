# Payment Rails Architecture

Alto Rich separates **Bank** and **Crypto** into independent payment rails. Admins can enable or disable each rail’s deposit and withdrawal directions instantly from the Admin Portal — no rebuild, restart, or redeploy.

## Source of truth

| Layer | Location | Purpose |
|-------|----------|---------|
| Defaults (version-controlled) | `src/config/payment-rails.ts` | Rail definitions, assets, networks, provider stubs, default copy |
| Live ops state | `settings` row `key = payment_rails` | Enabled flags, maintenance, messages, active assets/networks, addresses |
| Legacy sync | `settings.feature_flags`, `settings.bank_switchboard`, `settings.crypto_wallets` | Kept in sync when rails are saved |
| Audit | `audit_logs` action `settings.payment_rails_updated` | Who changed what, before/after, optional reason |

## Four independent controls

1. Bank deposits  
2. Bank withdrawals  
3. Crypto deposits  
4. Crypto withdrawals  

Any combination is valid. When both deposit rails are off, members see `bothDepositsDisabledMessage`. When only crypto withdrawals are on, members see `cryptoOnlyWithdrawalMessage`.

## Admin: enable / disable

1. Open **Admin App → Payment rails** (`/admin-app/payment-rails`)  
2. Toggle the desired rail directions (and optional maintenance flags)  
3. Configure crypto assets, networks, and platform receive addresses  
4. Optionally enter a change reason (audited)  
5. Click **Save payment rails**

Changes take effect on the **next request** (member pages are dynamic / no-store).

API: `GET/PATCH /api/admin/payment-rails`  
Member snapshot: `GET /api/payment-rails`

## Member UX

- **Deposits** adapt via `DepositRailsWorkspace` (bank form, crypto form, or picker).  
- **Withdrawals** adapt via `WithdrawalWorkspace` (bank, crypto, or both).  
- **Settings** hides bank accounts when bank rails are off; shows crypto wallet manager when crypto rails are relevant.  
- Crypto wallets are stored in `profiles.notification_preferences.payout` until the prepared migration is applied.

## Adding a cryptocurrency

1. Add the asset to `DEFAULT_PAYMENT_RAILS.cryptoAssets` in `src/config/payment-rails.ts`  
2. Ensure allowed networks exist in `cryptoNetworks`  
3. Enable the asset in Admin → Payment rails  
4. Add a platform receive address for each live network  

## Adding a blockchain network

1. Add the network to `DEFAULT_PAYMENT_RAILS.cryptoNetworks`  
2. Attach it to relevant assets’ `networks` arrays  
3. Enable in Admin and publish receive addresses  

## Adding a payment provider

1. Implement `PaymentProvider` in `src/services/payments/providers/`  
2. Register it in `PAYMENT_PROVIDER_REGISTRY`  
3. Reference its id from the rail’s `providerIds` in config  

Active providers today: `manual_bank`, `manual_crypto`. Others are stubs (`not_configured`).

## Settlement routing

`resolveSettlementPayoutRail()` (see `src/services/payments/settlement-router.ts`) chooses bank vs crypto from:

1. Live withdrawal rails  
2. Member preferred method  
3. Investment `payout_method`  

If no withdrawal rail is open, settlements are **held** (not silently sent via bank).

## Prepared migration (not applied)

`supabase/migrations/20260721220000_payment_rails_crypto_destinations.sql` adds:

- `member_crypto_wallets`  
- `payment_rail` / `asset_code` / `network_code` / `destination_snapshot` on deposits & withdrawals  
- optional `payment_provider` enum values  

**Do not apply until explicitly approved.** Rail toggles work without it.

## Local verification matrix

| Bank dep | Bank wd | Crypto dep | Crypto wd | Expected |
|----------|---------|------------|-----------|----------|
| ON | ON | OFF | OFF | Current Naira-only UX |
| OFF | OFF | ON | ON | Crypto-only funding & payouts |
| ON | ON | ON | ON | Method pickers on deposit & withdrawal |
| ON | OFF | OFF | ON | Bank fund + crypto payout only |
| OFF | OFF | OFF | OFF | Graceful unavailable messages |

Also verify Admin Payment rails page, Settings gating, notifications with `rail`/`method` in payload, and ROI settle routing.
