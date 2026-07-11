# AltoRich — Supabase Security Hardening Sprint Report

**Date:** 11 July 2026  
**Migration:** `20260711182234_supabase_security_hardening.sql`  
**Docs:** `docs/SECURITY.md`

---

## Executive summary

This sprint addressed Supabase Security Advisor warnings for AltoRich without changing application features, UI, or business logic. Changes focus on **RLS tightening**, **function `search_path` hardening**, **RPC least privilege**, and **storage enumeration prevention**. Leaked password protection (HIBP) is documented and scripted for hosted Auth configuration.

---

## 1. Warnings reviewed

| Finding | Classification | Action |
|---------|----------------|--------|
| `deposits_insert` `WITH CHECK (true)` | **Must Fix** | Replaced with authenticated + own `user_id` + pending-only insert |
| SECURITY DEFINER functions exposed to RPC | **Must Fix** | Revoked EXECUTE from PUBLIC/anon on triggers; restricted RPC grants |
| `wallet_balance` no ownership check | **Must Fix** | Added wallet ownership / admin guard inside function |
| Mutable `search_path` on functions | **Should Fix** | Set `search_path = public, pg_temp` on all public functions |
| Public avatars bucket listing | **Should Fix** | Storage SELECT limited to owner folder or admin |
| Leaked password protection disabled | **Must Fix (Auth)** | Script + docs; requires Dashboard or Management API (Pro) |
| `settings` / `vip_levels` / `roi_tiers` public SELECT | **Safe to Keep** | Intentional published catalogue data |
| `handle_new_user` SECURITY DEFINER | **Intentional Design** | Required for auth trigger; EXECUTE revoked from clients |
| `has_admin_role` SECURITY DEFINER | **Intentional Design** | Required for admin gate without exposing `admin_roles` table |
| `rls_auto_enable` (Supabase internal) | **False Positive / Platform** | Not modified — managed by Supabase |

---

## 2. Changes made

### Migration SQL

- **`set_updated_at`**, **`prevent_audit_mutation`**: added `SET search_path = public, pg_temp`
- **`has_admin_role`**, **`wallet_balance`**, **`record_investment_status_change`**, **`handle_new_user`**: hardened `search_path`
- **`wallet_balance`**: joins `wallets`, returns balance only for owner or admin
- **`deposits_insert`**: `TO authenticated` + `user_id = auth.uid()` + pending-only fields
- **RPC grants**: `has_admin_role` + `wallet_balance` → `authenticated`, `service_role` only
- **Trigger functions**: EXECUTE revoked from PUBLIC
- **Storage**: avatar/deposit/kyc SELECT policies prevent API bucket enumeration

### Application / tooling

- `scripts/verify-rls.mjs` — deposit insert + RPC probes for anon
- `scripts/enable-auth-hibp.mjs` — Management API helper for HIBP
- `supabase/config.toml` — `[auth.password] min_length = 8`
- `docs/SECURITY.md` — architecture reference

---

## 3. Warnings intentionally retained

| Item | Reason |
|------|--------|
| `settings` SELECT `USING (true)` | Public platform config (bank switchboard, announcements) |
| `vip_levels` / `roi_tiers` public read | Marketing and ROI calculator |
| `avatars` bucket `public = true` | Direct `<img>` URLs stored in profiles; listing blocked via policy |
| SECURITY DEFINER on `has_admin_role` | Only safe way to check admin without table exposure |
| Service role bypass for auth OTPs | Server-only auth flows; RLS would block registration/login |

---

## 4. Security improvements

- Anonymous users can no longer insert deposit rows via PostgREST
- Anonymous users cannot call `wallet_balance` or `has_admin_role` RPC
- Cross-user wallet balance probing via UUID returns `0` (no leak)
- Storage API cannot list all avatars or private documents
- All custom functions immune to `search_path` hijacking

---

## 5. Permission changes

```text
REVOKE EXECUTE … FROM PUBLIC (trigger functions)
GRANT EXECUTE has_admin_role → authenticated, service_role
GRANT EXECUTE wallet_balance → authenticated, service_role
deposits INSERT → authenticated role only
```

---

## 6. RLS improvements

- **`deposits_insert`**: from `WITH CHECK (true)` → ownership + pending state validation

---

## 7. Function hardening

All six application functions now use `SET search_path = public, pg_temp`.  
`wallet_balance` enforces authorization inside SECURITY DEFINER body.

---

## 8. Storage improvements

- Avatar/deposit-proof/KYC SELECT policies scoped to `{user_id}/` prefix or admin
- Public avatar URLs unchanged for UX

---

## 9. Authentication improvements

- Documented HIBP enablement path
- `npm run auth:hibp` for Management API
- Local password min length in `config.toml`
- Existing app-level `assertStrongPassword()` unchanged

---

## 10. Remaining recommendations

1. **Enable HIBP in production Dashboard** if not on Pro plan for API script
2. Re-run **Supabase Security Advisor** after `supabase db push`
3. Periodic **`npm run verify:rls`** in CI
4. Consider moving trigger-only functions to `private` schema in a future migration (optional)
5. Short JWT expiry + session revocation for sensitive financial actions (operational)

---

## Validation checklist

After applying migration, verify:

- [ ] Registration (`/auth/register`)
- [ ] Login (username + PIN)
- [ ] Dashboard load
- [ ] Wallet balance display
- [ ] Deposit submit (`/deposits`)
- [ ] Investment purchase
- [ ] Portfolio / withdrawals
- [ ] Referral / VIP pages
- [ ] Admin `/hard` access
- [ ] Avatar upload

```bash
supabase db push --linked --yes
npm run verify:rls
npm run verify:db
```

---

**No application feature code was modified in this sprint.**
