# Admin Authentication & Multi-Bank Management Sprint Report

**Date:** 11 July 2026  
**Status:** Complete — deployed to production

---

## 1. Root cause of the Admin login issue

Three compounding issues caused the “stuck login” behaviour:

| Issue | Effect |
|-------|--------|
| **Separate admin login UI** (`/hard/auth`) never called `setLoading(false)` on success | Button stayed on “Signing in…” with no error — appeared frozen |
| **Client-side soft navigation** (`router.push` + `router.refresh`) after cookie-based auth | Session cookies were set server-side, but soft navigation could race middleware before cookies were applied — no redirect, no feedback |
| **Split auth paths** (email/password admin vs username/pin members) | Operators changed password on `/auth/change-password` then returned to `/hard/auth`, repeating a fragile flow |

There was no Supabase outage or missing env vars. The API returned `200` with a redirect; the **client never completed navigation** and **never reset loading state**.

---

## 2. Fix implemented

### Authentication
- **Unified login at `/auth/login`** with tabs:
  - **Email & password** — operators and any member with a password
  - **Username & pin** — existing member flow (unchanged)
- **New API:** `POST /api/auth/sign-in` — email/password auth + role lookup
- **Role-based redirect** via `resolvePostLoginRedirect()`:
  - Admin → `/admin` (or password change first)
  - Member → `/dashboard` (or pin/password change first)
- **Hard navigation after login:** `window.location.assign(redirect)` ensures cookies are active before the next page load
- **Loading phases:** Signing in… → Authenticating… (OTP) → Redirecting… + slow-login message after 8s
- **`/hard/auth` redirects to `/auth/login`** — no separate admin login page
- **Middleware:** unauthenticated `/admin` → `/auth/login?redirect=/admin`; signed-in users on `/auth/login` auto-route to admin or dashboard
- **Password change** uses hard navigation and role-aware redirect (no longer always `/admin`)

### Files changed (auth)
- `src/components/auth/LoginForm.tsx`
- `src/app/api/auth/sign-in/route.ts`
- `src/lib/auth/post-login-redirect.ts`
- `src/lib/auth/admin-role.ts`
- `src/services/auth/auth.service.ts`
- `src/middleware.ts`, `src/app/admin/layout.tsx`
- `src/app/hard/auth/page.tsx` (redirect)
- `src/app/api/auth/login/route.ts`, `verify-device`, `change-password`

---

## 3. Authentication improvements

- Single Supabase session/cookie pipeline for all users
- Fast admin check: one `admin_roles` lookup by `user_id` (service client)
- Middleware hardened with try/catch on session refresh
- Deprecated `/api/hard/auth/login` — forwards to same logic as `/api/auth/sign-in` for backward compatibility

---

## 4. Admin role verification

Roles supported (existing enum): `super_admin`, `admin`, `finance`, `support`  
Lookup: `admin_roles` table via `userIsAdmin()` / `getAdminRoleForUser()`  
Redirect loops prevented by:
- Middleware skipping forced password change on `/auth/change-password`
- Admin layout only guarding `/admin/*`, not auth routes

---

## 5. Multiple bank account implementation

### Database
**Migration:** `supabase/migrations/20260711193000_funding_accounts.sql`

```sql
funding_accounts (
  bank_name, account_name, account_number,
  sort_code, display_name, funding_instructions,
  display_order, status, is_preferred,
  created_at, updated_at
)
```

Status enum: `active` | `inactive` | `maintenance`  
RLS: members read **active** accounts; admins manage all.

### Backend
- `FundingAccountService` — list, create, update, delete, set preferred
- `GET /api/funding-accounts` — active accounts for members
- `GET/POST /api/admin/funding-accounts` — admin list/create
- `PATCH/DELETE /api/admin/funding-accounts/[id]` — edit/disable/delete
- `POST /api/admin/funding-accounts/[id]/prefer` — set default
- `getBankSwitchboard()` reads preferred active account first (legacy settings fallback)

### Admin UI
- **`/admin/funding-accounts`** — Funding Accounts page
- Add / Edit modal, disable, delete, set preferred
- Linked from admin sidebar

---

## 6. Funding page improvements

**`/deposits` (Funding)** now shows:
- Grid of **premium bank cards** (all active accounts)
- Preferred badge on recommended account
- Copy account number & account name buttons
- Cleaner hero copy — “Transfer to any account”
- Empty state when no accounts configured

Legacy single `BankTransferPanel` replaced by `FundingAccountsGrid`.

---

## 7. UI/UX improvements

- Login never appears frozen (phase labels + slow message)
- Hard redirect after auth (reliable session handoff)
- Fintech-style funding cards with bank initials, preferred badge, copy actions
- Admin funding management with status badges and inline actions

---

## 8. Database changes

| Change | Scope |
|--------|--------|
| New table `funding_accounts` | Required for multi-bank |
| New enum `funding_account_status` | active / inactive / maintenance |
| RLS policies | Member read active; admin CRUD |
| Seed row | One default account from legacy switchboard |

**No changes** to investment logic, wallet calculations, or member `bank_accounts` (payout accounts).

---

## 9. Remaining recommendations

1. **Run migration on Supabase** if not auto-applied: `supabase db push`
2. **Populate real bank accounts** at `/admin/funding-accounts` (replace seed placeholders)
3. **Optional:** Remove legacy bank switchboard form on `/admin` main page once all accounts migrated
4. **Optional:** Add Nigerian bank logo assets per institution
5. **Manual QA:** Sign in as `ops@altorich.com` via `/auth/login` → Email & password → confirm `/admin` redirect

---

## QA checklist

| Test | Expected |
|------|----------|
| Admin email login | Redirect to `/admin` or change-password then `/admin` |
| Member username/pin login | Redirect to `/dashboard` |
| `/hard/auth` | Redirects to `/auth/login` |
| Logout → login again | Session persists correctly |
| Funding page | Shows all active accounts |
| Add/edit/disable/preferred account | Reflects on member funding page |
| Production build | Passes |

---

**Test accounts**
- Admin: `ops@altorich.com` + password → `/auth/login` (Email & password tab)
- Demo member: `demouser` / pin `123456` → Username & pin tab
