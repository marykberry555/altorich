# AltoRich Security Architecture

**Last updated:** July 2026  
**Scope:** Supabase Postgres, Auth, Storage, and RPC exposure for [altorich.com](https://altorich.com)

This document describes the security posture enforced in migrations and application code. It complements the Supabase Security Advisor audit and the `20260711182234_supabase_security_hardening.sql` migration.

---

## Principles

1. **RLS on every public table** — all member and financial data is scoped by `auth.uid()` or admin role checks.
2. **Service role is server-only** — privileged writes (auth OTPs, admin approvals, webhooks) use `SUPABASE_SERVICE_ROLE_KEY` in Next.js API routes only.
3. **SECURITY DEFINER sparingly** — used only where RLS would block legitimate system operations; EXECUTE is restricted.
4. **No authorization from `user_metadata`** — admin flags live in `admin_roles` and `app_metadata`, never user-editable JWT claims.

---

## Row Level Security (RLS)

### Member-scoped tables

| Table | Member access | Admin access |
|-------|---------------|--------------|
| `profiles` | SELECT/UPDATE own row | SELECT all |
| `wallets` | SELECT own | SELECT all |
| `wallet_transactions` | SELECT via wallet ownership | SELECT all |
| `investments` | SELECT/INSERT own | SELECT all |
| `deposits` | SELECT own; INSERT own pending only | SELECT/UPDATE all |
| `withdrawals` | SELECT/INSERT own | SELECT/UPDATE |
| `bank_accounts` | CRUD own | SELECT all |
| `notifications` | SELECT/UPDATE own | via service role |
| `kyc_documents` | SELECT/INSERT own | UPDATE |
| `referrals` | SELECT as referrer or referred | SELECT all |
| `activity_logs` | SELECT/INSERT own | SELECT all |

### Public read (intentional)

| Table | Policy | Reason |
|-------|--------|--------|
| `settings` | `SELECT USING (true)` | Published platform config (bank instructions, announcements) |
| `vip_levels` | `SELECT USING (true)` | Marketing / VIP tier display |
| `investment_plans` | Active plans or admin | Public packages catalogue |
| `roi_tiers` | `SELECT USING (true)` | ROI tier bands for calculator |
| `funding_accounts` | Active accounts only | Public deposit bank details |

### Deposits insert (hardened)

Previously `WITH CHECK (true)` allowed any role (including anonymous) to insert arbitrary deposit rows.

**Current policy (`deposits_insert`):**

- Role: `authenticated` only
- `user_id = auth.uid()`
- `status = 'pending'`
- No reviewer or wallet linkage on insert

Server-side deposit creation via Paystack/webhooks uses the **service role**, which bypasses RLS.

---

## SECURITY DEFINER functions

| Function | Definer? | Callable by | Purpose |
|----------|----------|-------------|---------|
| `has_admin_role(role?)` | Yes | `authenticated`, `service_role` | Read `admin_roles` without exposing table to members |
| `wallet_balance(wallet_id)` | Yes | `authenticated`, `service_role` | Aggregate ledger; enforces wallet ownership inside function |
| `handle_new_user()` | Yes | Trigger only (EXECUTE revoked) | Bootstrap profile, wallets, referral on signup |
| `record_investment_status_change()` | Yes | Trigger only | Audit trail for investment status |
| `set_updated_at()` | No | Trigger only | `updated_at` maintenance |
| `prevent_audit_mutation()` | No | Trigger only | Immutable audit logs |

### Why `has_admin_role` stays SECURITY DEFINER

Members cannot read `admin_roles` directly. Middleware and session helpers call `supabase.rpc('has_admin_role')` to gate `/hard` admin routes. Revoked from `anon`.

### Why `wallet_balance` stays SECURITY DEFINER

Ledger rows are admin-insert only; members need a computed balance. The function joins `wallets` and only aggregates when `w.user_id = auth.uid()` or caller is admin.

---

## RPC permissions

```sql
GRANT EXECUTE ON FUNCTION public.has_admin_role(public.admin_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.wallet_balance(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_investment_status_change() FROM PUBLIC;
```

PostgREST exposes only granted functions. Trigger functions are not intended for client RPC.

Application usage:

- `src/middleware.ts` — `has_admin_role`
- `src/lib/auth/session.ts` — `has_admin_role`
- `src/services/wallet/wallet.service.ts` — `wallet_balance`

---

## Storage policies

| Bucket | Public URL | API list/read |
|--------|------------|---------------|
| `avatars` | Yes (direct URL in `profiles.avatar_url`) | Owner folder or admin only |
| `deposit-proofs` | No (signed URLs) | Owner folder or admin |
| `kyc-documents` | No (signed URLs) | Owner folder or admin |

**Avatar listing:** The bucket remains public so `<img src="...">` works without signed URLs. Storage API `list()` is restricted to prevent enumeration of all member avatars.

Upload paths: `{user_id}/filename` enforced on INSERT/UPDATE.

---

## Authentication

### Username + PIN UX

Members sign in with username and PIN. Supabase Auth stores a random internal password; PIN is hashed in `profiles.pin_hash`. This UX is unchanged by security hardening.

### Password strength (internal / recovery)

Application layer: `assertStrongPassword()` in `src/lib/validation/identity.ts` (min 8, upper, lower, digit, symbol).

Supabase Auth (hosted):

- **Leaked password protection (HIBP):** enable in Dashboard → Auth → Providers → Email, or run `npm run auth:hibp` with `SUPABASE_ACCESS_TOKEN`.
- Requires Pro plan or `password_hibp` entitlement on hosted projects.
- Local `supabase/config.toml`: password settings are managed in Dashboard (CLI `[auth.password]` not supported on current CLI version)

### Auth tables

| Table | Access |
|-------|--------|
| `auth_otps` | Service role only (server auth flows) |
| `trusted_devices` | Own rows or admin |

---

## Roles

| Role | Usage |
|------|--------|
| `anon` | Public reads (settings, plans, roi_tiers); no financial writes |
| `authenticated` | Member session via anon key + JWT |
| `service_role` | Next.js server only — bypasses RLS |
| `admin_roles` table | `super_admin`, `admin`, `finance`, `support` |

Never expose `service_role` in client bundles or `NEXT_PUBLIC_*` env vars.

---

## Verification

```bash
npm run verify:rls      # Anonymous access probes
npm run verify:db       # Schema connectivity
npm run gate:production # No dev URLs / trust-breaking patterns in src
```

After migrations:

```bash
supabase db push --linked --yes
npm run verify:rls
```

---

## Related files

- `supabase/migrations/20260711182234_supabase_security_hardening.sql`
- `scripts/verify-rls.mjs`
- `scripts/enable-auth-hibp.mjs`
- `docs/SUPABASE_SECURITY_HARDENING_REPORT.md`
