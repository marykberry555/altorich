# Account Status Simplification

**Status:** Local only — **not committed, not pushed, not deployed**. Migration **not applied**.  
**Date:** 2026-07-24  
**Model:** Single `profiles.account_status` field with three values only.

---

## Status model

| Status | Meaning | Login | Dashboard | Deposits | Invest / withdraw / earn / referrals / WB / settlement / cron |
|--------|---------|-------|-----------|----------|----------------------------------------------------------------|
| **active** | Fully operational | Yes | Yes | Yes | Yes |
| **paused** | Temporary admin review (KYC, duplicates, unusual activity, compliance) | Yes | Yes + banner | **Yes** (funds locked until resume) | **No** |
| **blocked** | Complete access restriction (fraud, abuse, regulatory, permanent closure) | **No** | **No** | **No** | **No** |

### Paused business rules

- Member is **not** banned; account remains usable for funding and review.
- Deposits are accepted and recorded normally.
- Deposited funds **must not** auto-invest, earn, or be withdrawn while paused.
- On resume to **active**: normal rules continue from that point; **no back-pay** for the paused period (engines only credit ACTIVE users at processing time).
- Banner copy (exact, platform-wide):

> Your account is temporarily under review.

Do not expose internal pause reasons (KYC, duplicates, compliance, risk, etc.) to members.

### Blocked business rules

- Login denied; existing sessions revoked; APIs denied; ignored by all financial engines.

### Legacy mapping

| Old value | New value |
|-----------|-----------|
| `suspended` | `blocked` |
| `disabled` | `blocked` |
| `deactivated` | `blocked` |

`normalizeAccountStatus()` also maps these at runtime until migration is applied.

---

## Migration summary

File: `supabase/migrations/20260724010000_account_status_active_paused_blocked.sql`

1. Creates `account_status_history` (previous/new status, reason, admin, IP, request id, timestamp)
2. Rebuilds enum to `active | paused | blocked` via text `CASE` (safe in one transaction)
3. Normalizes current `profiles.account_status` rows (`suspended` / `disabled` / `deactivated` → `blocked`)
4. Updates `admin_prepare_member_hard_delete` to set `blocked` (not `deactivated`)
5. Does **not** rewrite historical audit log text

---

## Business rule changes vs prior five-status model

| Area | Before | After |
|------|--------|-------|
| Status count | 5 (active/paused/suspended/disabled/deactivated) | 3 (active/paused/blocked) |
| Paused deposits | Denied | **Allowed** |
| Paused invest/withdraw/earn | Denied | Denied (unchanged) |
| Lockout statuses | suspend / disable / deactivate | Single **blocked** |
| Admin UX | Multiple action buttons | One status control + required reason |
| Soft-delete marker | `deactivated` | `blocked` |

---

## Enforcement points

| Layer | Behavior |
|-------|----------|
| `policy.ts` | `canLogin` / `canAccessMemberApp` / `canDeposit` / `canTransact` / cron eligibility / session revoke |
| `enforce.ts` | `assertCanLogin`, `assertCanDeposit`, `assertCanTransact`, `filterActiveUserIds` |
| `requireSessionUser` | active \| paused |
| `requireDepositUser` | active \| paused |
| `requireFinancialUser` | active only |
| Auth login | Blocks blocked (incl. legacy) |
| Middleware | Signs out blocked; redirects `?locked=blocked` |
| Deposits API + service + proof upload | `requireDepositUser` / `assertCanDeposit` |
| Withdraw / invest / referral payout / WB / auto-withdraw | `requireFinancialUser` / `assertCanTransact` |
| Settlement / referral / WB unlock / auto-invest | ACTIVE-only filters |
| Admin `PATCH /api/admin/members/[id]` | Status change requires reason (≥3 chars); history + audit + revoke |

---

## Files modified (high level)

- Policy / enforce / session helpers / revoke-sessions
- Auth service, middleware, login page / LoginForm
- Deposit / withdrawal / investment / settlement / referral / welcome-bonus services
- Admin members API (PATCH status, actions cleaned), profile PATCH (status removed from form)
- Admin UI: `MemberAccountStatusControl`, simplified `MemberActionsMenu` / `AdminQuickActions`, profile view
- Types, StatusBadge, search filters, fraud/security locked-account queries
- Migration + tests + this doc

---

## Test coverage

| Suite | Focus |
|-------|-------|
| `policy.test.ts` | Active / paused deposit-allowed / blocked / legacy normalize |
| `enforce.test.ts` | Deposit vs transact gates; active filter |
| `session-policy.test.ts` | Regression matrix (incl. no retroactive earn concept) |

`npx tsx --test src/lib/account-status/**/*.test.ts` — run before approval.

---

## Manual review items

1. Apply migration in a staging/prod window **before** deploying app code that writes `blocked`.
2. Smoke paused: login → deposit succeeds → invest/withdraw fail → banner visible → settle cron skips user.
3. Smoke resume: wallet funds investable under normal rules; no earnings for paused days.
4. Smoke blocked: login denied; existing session forced out; deposit denied.
5. Confirm admin status control requires reason and writes `account_status_history` + audit.
6. Confirm member hard-delete still frees identity and sets `blocked`.

---

## Explicit non-actions

- No deploy  
- No commit  
- No push  
- Migration not applied remotely  

Awaiting approval.
