# Alto Rich — Production Polish Sprint Report

**Date:** 11 July 2026  
**Commit:** `37349c3`  
**Status:** Built successfully · Deployed to production

---

## 1. Investment accrual improvements

- Added `src/lib/investment/accrual-math.ts` — shared time-aware pro-rata engine using investment `started_at`, `last_weekly_settlement_at`, weekly ROI bps, and Monday 09:00 WAT settlement windows.
- `processWeeklyMondaySettlements` now credits proportional interest — mid-week starters no longer receive a full week's ROI on first settlement.
- Settlement schedules at purchase use pro-rata amounts for weekly plans.
- Live display and backend settlement share the same math.

## 2. Live accrual countdown implementation

- Redesigned `InvestmentAccrualPanel`: Live interest accrual (animated) above settlement countdown (HH:MM:SS), plus current value, estimated next settlement, and credited totals.
- Dashboard and portfolio components pass `weeklyRoiBps` and settlement timestamps for live sync.

## 3. Branding and favicon updates

- Verified official assets in `public/brand/`, `public/icons/`, `public/og/`.
- Root layout wires theme-aware favicons, Apple touch icon, Android icons, manifest, OG/Twitter via `src/lib/brand.ts`.

## 4. Social sharing improvements

- `src/lib/seo.ts` provides canonical URLs, OG images, and Twitter cards for marketing pages.
- Root metadata includes full Open Graph and Twitter card configuration.

## 5. Number formatting standardization

- `formatNaira()` always renders two decimal places (e.g. `₦1,234.00`) application-wide.

## 6. Bank account deletion fix

- **Root cause:** No DELETE API existed; settings had no delete UI.
- Added `DELETE /api/bank-accounts/[id]` and `BankAccountsManager` on Settings with success confirmation and refresh.
- Service layer verifies row deletion (404 if not found).

## 7. User area cleanup

- Deposits: removed duplicate balance cards.
- Dashboard: reduced redundant metrics from 6 → 4.
- Removed all user-visible "Configure in admin" placeholders.

## 8. Username & PIN login

- `/auth/login` — username + PIN only.
- `/hard/auth` — admin email/password for operators.

## 9. Trusted device recognition

- Configurable TTL (default 90 days) via `/hard/settings`.
- Expired devices require OTP again.

## 10. Email notifications

- Branded activity templates in `src/lib/email/activity-templates.ts`.
- Auto-email for funding, payouts, investment activation, profile updates, new device sign-in (when Resend configured).

## 11. Funding page copy

- Production fallbacks replace developer placeholders; live funding accounts displayed when configured.

## 12. Production deployment

- Build: PASS · Deploy: `37349c3` · Health: https://altorich.com/api/health OK

## 13. Remaining recommendations

1. Page-specific OG metadata for additional marketing slugs if SEO audit requires it.
2. Referral reward email when payout events are finalized.
3. Password-changed email when member password change is exposed.
4. Staging E2E test: two investors starting different days → verify pro-rata settlement amounts.
5. Optional: web push notifications.
