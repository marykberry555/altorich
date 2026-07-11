# Referral, VIP & Loyalty Programme — Implementation Report

**Date:** July 10, 2026  
**Sprint:** Production referral & VIP redesign  
**Build:** `npm run build` passes (apply migration before using referral payouts in production)

---

## 1. Referral Dashboard

**Route:** `/team` (nav label: **Referrals**)

Premium fintech dashboard with:

| Feature | Implementation |
|---------|----------------|
| Referral code & link | From `profiles.invite_code` |
| Copy buttons | Clipboard API |
| QR code | QR Server API image |
| Social share | WhatsApp, Telegram, Facebook, X, Email |
| Metrics | Total / verified / pending referrals, investment volume |
| VIP progress | Progress bar to next tier |
| Referral wallet | Separate balance panel |
| Activity | Recent referrals & rewards lists |
| VIP tier cards | All configurable levels |

**Components:** `ReferralDashboardClient`, `ReferralPayoutPanel`, `VipLevelUpCelebration`, `ConfettiBurst`

Compliant disclaimer: rewards only for genuine investors who complete first investment — not guaranteed income.

---

## 2. Referral Commission Engine

**Trigger:** First **active** investment only (`InvestmentService.purchasePlan` → `ReferralService.processFirstInvestmentActivated`)

**Validation chain:**
1. User registered with referral code (`referred_by` + `referrals` row)
2. Registration complete (profile exists)
3. Wallet funded (investment requires balance)
4. **First** investment activates (count of prior active investments = 0)
5. Referral status moves `pending` → `verified`

**Commission:** Package tier rate from admin config (`commission_by_package`), elevated by referrer VIP rate via `max(packageRate, vipRate)`.

**One-time:** Only first activated investment per referred user. `recurring_commissions_enabled` flag exists (default **false**) for future architecture.

**Removed:** Weekly fixed referral dividends from VIP display (weekly_dividend seeded to 0).

---

## 3. VIP Progression

| Level | Label | Verified investors | Commission | Milestone |
|-------|-------|-------------------|------------|-----------|
| 0 | Starter | 0 | 3% | ₦0 |
| 1 | Growth | 5 | 4% | ₦15,000 |
| 2 | Elite | 20 | 5% | ₦50,000 |
| 3 | Premium | 50 | 6% | ₦200,000 |

Stored in `vip_levels` table — editable from admin without code changes.

Auto-promotion when verified referral count crosses threshold.

---

## 4. Milestone Bonus System

When referrer levels up and `milestone_bonuses_enabled` is true:
- One-time credit to referral wallet (`REF` currency ledger)
- Record in `referral_rewards` (`reward_type: milestone`)
- In-app notification + level-up celebration modal

---

## 5. Referral Wallet

**Separate ledger:** Wallet currency `REF` (not mixed with `NGN` investment wallet)

Uses existing `wallet_transactions` with `reason: referral_commission` — **no changes to ledger architecture**.

Tracks:
- Available rewards (balance minus pending payout holds)
- Lifetime rewards (`referral_rewards` sum)
- Already paid (`referral_payouts` where status = paid)

Auto-created on signup (migration + `ensureReferralWallet` fallback).

---

## 6. Request Payout Flow

**Route:** `/api/referrals/payouts` (POST)

- Minimum threshold from `referral_program.min_payout_threshold` (default ₦5,000)
- Button disabled with message when below threshold
- Saved bank accounts via existing `/api/bank-accounts`
- Manual bank entry supported
- Debits referral wallet (pending ledger entry)
- Admin approve / reject / mark paid

**Statuses:** pending → processing → approved → paid | rejected | cancelled

Reject reverses funds to referral wallet.

---

## 7. Admin Referral Management

**Route:** `/admin#referrals`

`AdminReferralManagement` module:
- Enable/disable programme
- Milestone bonuses toggle
- Recurring commissions toggle (off by default)
- Min payout threshold
- Per-package commission %
- VIP level editor (label, verified count, commission %, milestone bonus)
- Analytics (total / verified referrals, top referrers)
- Pending payout queue with approve/reject/paid actions

**API:** `/api/admin/referrals` (GET/PUT), `/api/admin/referrals/payouts/[id]` (POST)

---

## 8. Mobile Responsiveness

- Responsive metric grids (1 → 2 → 4 columns)
- Share tools stack on mobile
- Bottom-sheet friendly payout form
- QR + link blocks adapt to narrow viewports
- VIP cards 1 → 2 → 4 column grid

---

## 9. UI/UX Enhancements

- Premium gradient hero with VIP badge
- Confetti + modal on VIP level up
- Progress bars for VIP and payout gaps
- Dark-theme compatible tokens throughout
- Nav renamed Team → **Referrals**
- `/vip` page redesigned for growth tiers (links to referral dashboard)
- USW-inspired: clean summary cards, celebration screen, step clarity — Alto Rich branding preserved

---

## 10. Remaining Recommendations Before Production Launch

1. **Apply migration:** Run `supabase/migrations/20260710180000_referral_vip_programme.sql` on production.
2. **Backfill REF wallets** for existing users (migration handles this).
3. **Email templates** for referral verified, VIP level up, payout status (in-app notifications wired; email channel stub exists).
4. **Referral payout history table** on member dashboard (currently via notifications + admin).
5. **Fraud review:** Admin manual review queue before auto-approving large commissions.
6. **Rate limiting** on payout requests.
7. **Export CSV** for referral rewards and payouts in admin.
8. **Redirect `/referral`** to `/team` instead of register-only (optional UX).
9. **Integration tests** for first-investment-only commission rule.
10. **Legal copy review** for Nigerian cooperative / investment compliance.

---

## Files Added / Modified (Key)

| Area | Files |
|------|-------|
| Migration | `supabase/migrations/20260710180000_referral_vip_programme.sql` |
| Service | `src/services/referral/referral.service.ts` |
| Config | `src/lib/referral/config.ts`, `src/lib/referral/types.ts` |
| Wallet | `src/services/wallet/wallet.service.ts` (REF credits/debits) |
| Investment hook | `src/services/investment/investment.service.ts` |
| API | `src/app/api/referrals/*`, `src/app/api/admin/referrals/*` |
| UI | `src/components/referral/*`, `src/app/(app)/team/page.tsx` |
| Admin | `src/components/admin/AdminReferralManagement.tsx` |
| VIP | `src/app/(app)/vip/page.tsx` |

---

## Constraints Preserved

- Authentication unchanged
- Wallet ledger architecture unchanged (new REF wallet uses same transaction model)
- Investment engine logic unchanged (hook added post-activation only)
- Build passes
