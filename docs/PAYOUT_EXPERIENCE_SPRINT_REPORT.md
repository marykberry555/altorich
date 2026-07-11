# Payout Experience Sprint Report

**Deploy branch:** `main`  
**Scope:** Payout UX, single bank account, automatic weekly earnings withdrawal, admin request-type visibility, notifications.

---

## 1. Payout UX improvements

- **Removed payout window blocking** — Users can submit payout requests at any time. The API no longer rejects requests outside Mon/Thu 8:00 WAT.
- **Positive scheduling messaging** — Submissions return a clear schedule message (e.g. *"scheduled for processing on Monday at 9:00 AM"*).
- **Premium schedule card** — `/withdrawals` shows **Next payout · Monday · 9:00 AM WAT** with a live countdown timer.
- **Simplified form** — Available balance, payout amount, bank account summary, optional note, and **Request payout** only.
- **Cleaner history** — Table columns: Date, Reference, Amount, Status with premium badges (Scheduled, Pending, Processing, Paid, etc.).
- **Mobile-first layout** — Narrow `max-w-3xl` flow, reduced cards, improved spacing and typography.

## 2. Bank account management improvements

- **Single payout account** — `upsertPayoutBankAccount()` updates the existing account instead of creating duplicates; extra accounts are removed.
- **Dedicated payout section** — Add / Edit / Update bank account UI on the payout page (`PayoutBankAccountSection`).
- **API upsert** — `POST`/`PUT` `/api/bank-accounts` replaces the user's payout account.
- Payout requests auto-save bank details via upsert on submit.

## 3. Automatic weekly payout implementation

- **Profile flag** — `profiles.auto_weekly_payout` (migration `20260712070000_payout_experience.sql`).
- **UI toggle** — *Automatic weekly payout* on `/withdrawals` via `PATCH /api/payout/auto-withdraw`.
- **Monday processing** — In `processWeeklyMondaySettlements`, when enabled:
  - Accrued interest is calculated with existing `settlementInterestForInvestment()` (investment engine unchanged).
  - **Principal is not reduced** — only `total_earned` and `last_weekly_settlement_at` update.
  - Earnings are credited to wallet via existing `creditInvestmentSettlement()`.
  - An **automatic** withdrawal request is created for the same amount.
- **Capital protection** — Reinvest path remains default when auto payout is off; principal is never auto-withdrawn.

## 4. Admin enhancements

- **`request_type`** on withdrawals: `manual` | `automatic`.
- Admin payouts page (`/hard/payouts`) shows **Request type** badges on open and recent payouts.
- Open queue includes both `scheduled` and `pending` requests.

## 5. Notification improvements

New in-app + email events:

| Event | When |
|-------|------|
| `withdrawal.auto_scheduled` | User enables automatic weekly payout |
| `withdrawal.auto_created` | Monday auto payout request created |
| `withdrawal.auto_skipped` | Auto payout skipped (no bank account) |
| `withdrawal.submitted` | Manual request promoted / submitted (includes schedule message) |
| `withdrawal.paid` | Admin approves and ledger debits |

## 6. Ledger validation

- **No wallet math changes** — `WalletService` debit/credit methods untouched.
- Manual and automatic payouts still debit only on **admin approval** via existing `debitWithdrawal()`.
- Auto payout credits earnings first (settlement credit), then queues withdrawal; approval debits the same amount.
- Scheduled requests do not touch the ledger until approved.

## 7. Mobile improvements

- Single-column payout flow with touch-friendly toggle and full-width submit.
- Countdown digits stack on small screens; bank card and form use responsive padding.
- History table scrolls horizontally on narrow viewports.

## 8. Remaining recommendations

1. **Apply migration** — Run `20260712070000_payout_experience.sql` on production Supabase.
2. **Separate approve vs pay steps** — Optional intermediate `approved` → `paid` for clearer *Processing* state.
3. **Cap auto payout** — Optionally limit auto withdrawal to wallet balance minus user-funded deposits if commingling grows.
4. **Push/SMS** — Extend auto payout notifications to SMS for high-value members.
5. **Settings sync** — Mirror single-account UX on `/settings` bank manager (currently multi-delete UI).

---

## Key files

| Area | Path |
|------|------|
| Migration | `supabase/migrations/20260712070000_payout_experience.sql` |
| Schedule logic | `src/lib/payout/schedule.ts` |
| Status labels | `src/lib/payout/status.ts` |
| Withdrawal service | `src/services/withdrawal/withdrawal.service.ts` |
| Settlement hook | `src/services/investment/settlement.service.ts` |
| Payout page | `src/app/(app)/withdrawals/page.tsx` |
| Auto toggle API | `src/app/api/payout/auto-withdraw/route.ts` |
| Admin payouts | `src/app/hard/(ops)/payouts/page.tsx` |

## QA checklist

- [x] Manual payout requests accepted outside window (scheduled status)
- [x] Bank account upsert (single account)
- [x] Automatic weekly payout toggle + Monday settlement branch
- [x] Pending / scheduled queue + cron promotion
- [x] Admin request type display
- [x] Ledger debits only on approval (unchanged)
- [x] Build passes
- [ ] Production migration applied
- [ ] End-to-end test with live cron on staging
