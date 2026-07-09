# AltoRich — Foundation Phase Report

**Date:** 8 July 2026  
**Brand:** AltoRich · **Domain:** altorich.com  
**Legal entity:** ALTORICH LTD · Company No. 13579416  
**Director:** Mr Karol Kempa  
**Registered address:** Kemp House 152-160, City Road, London, England, EC1V 2NX  

---

## 1. Architecture changes made

| Area | Before | After |
|------|--------|-------|
| **Data layer** | `data/store.json` + `lib/server/store.ts` | Supabase Postgres + service layer |
| **Auth** | None (open `/admin`) | Supabase Auth (email, Google OAuth, middleware session refresh) |
| **Business logic** | Inline in API routes / pages | `src/services/*` (wallet, deposit, investment, payment, notification, settings) |
| **Types** | Ad-hoc domain types | `src/types/database.ts` aligned to schema |
| **Branding** | AltoRich / ALTORICH LTD |
| **Reference assets** | 15 HTML + 15 asset folders at repo root | `docs/reference/` |
| **Design** | Light admin template | Dark premium fintech system (Stripe/Revolut-inspired) |

**Folder structure:**

```
src/
  app/           # Next.js App Router pages + API routes
  components/    # UI primitives + AppChrome + auth forms
  lib/           # company, env, domain, supabase clients, services factory
  services/      # wallet, deposit, investment, payment, notification, admin
  types/         # Database types
supabase/
  migrations/    # Foundation schema + RLS + seeds
  config.toml
docs/
  reference/     # Archived competitor HTML (reference only)
```

---

## 2. Database schema created

Migration: `supabase/migrations/20260708160000_foundation_schema.sql`

| Entity | Purpose |
|--------|---------|
| `profiles` | Member identity, invite code, VIP level, referral link |
| `admin_roles` | RBAC: super_admin, admin, finance, support |
| `settings` | Platform config (bank switchboard, announcements, withdrawal windows) |
| `vip_levels` | Tier configuration (seeded VIP 0–4) |
| `wallets` | One wallet per user per currency |
| `wallet_transactions` | **Ledger-only** balance mutations |
| `investment_plans` | Product catalog (6 seeded plans) |
| `investments` | Member plan purchases |
| `investment_settlements` | Scheduled payout rows |
| `deposits` | Bank transfer verification queue |
| `withdrawals` | Payout requests |
| `bank_accounts` | Member payout accounts |
| `referrals` | Invite tracking + commission |
| `notifications` | In-app + future channels |
| `audit_logs` | Admin action trail |
| `activity_logs` | Member activity trail |
| `kyc_documents` | Future KYC storage paths |

**Database functions:**
- `wallet_balance(wallet_id)` — computed from ledger
- `has_admin_role(role?)` — RLS helper
- `handle_new_user()` — auto-creates profile + wallet on signup

**RLS:** Enabled on all tables with member-own / admin-role policies.

---

## 3. Authentication implemented

| Feature | Status |
|---------|--------|
| Supabase SSR clients (`browser`, `server`, `middleware`) | ✅ |
| Email/password signup + login | ✅ |
| Google OAuth + `/auth/callback` | ✅ (requires Supabase dashboard config) |
| Phone OTP | 🔲 Architecture-ready, not wired |
| Middleware session refresh | ✅ |
| Protected routes (`/profile`, `/investments`, `/withdraw`, `/settings`, `/team`, `/admin`) | ✅ |
| Admin role verification in middleware | 🔲 Uses cookie presence only — needs `admin_roles` check |

---

## 4. Files removed

- `data/store.json` — entire `data/` directory deleted
- `src/lib/server/store.ts` — JSON persistence layer
- `src/lib/plans.ts` — replaced by DB-backed `investment_plans`
- `src/lib/vip.ts` — replaced by DB-backed `vip_levels`
- 15 HTML files + 15 `*_files/` asset folders from project root (archived)

---

## 5. Files added

**Infrastructure**
- `supabase/migrations/20260708160000_foundation_schema.sql`
- `supabase/config.toml`
- `src/middleware.ts`
- `src/lib/supabase/{client,server,middleware}.ts`
- `src/lib/{company,env,utils,services}.ts`
- `src/types/database.ts`

**Services**
- `src/services/wallet/wallet.service.ts`
- `src/services/deposit/deposit.service.ts`
- `src/services/investment/investment.service.ts`
- `src/services/payment/payment.service.ts` + providers
- `src/services/notification/notification.service.ts`
- `src/services/admin/settings.service.ts`

**UI**
- `src/components/ui/{Button,Card,StatCard,Input,Badge,Skeleton}.tsx`
- `src/components/auth/LoginForm.tsx`

**Auth pages**
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/signup/page.tsx`
- `src/app/auth/callback/route.ts`

**Docs**
- `docs/reference/` (30 archived files)
- `docs/FOUNDATION_REPORT.md` (this file)

---

## 6. UI system improvements

- **Dark premium theme** — zinc/indigo palette, subtle gradients, glass sidebar
- **Typography** — Inter via `next/font`, tight tracking, tabular nums for money
- **Components** — Reusable `Button`, `Card`, `StatCard`, `Input`, `Badge`, `Skeleton`
- **Removed** — thick borders, oversized white cards, bootstrap-style admin look
- **Added** — live pill, elevated cards, stat grid, setup banner when Supabase unconfigured

---

## 7. Components redesigned

| Component | Changes |
|-----------|---------|
| `AppChrome` | AltoRich branding, legal entity subtitle, full nav from reference UX |
| `ContributionForm` | New UI primitives, AR- reference prefix |
| `PageHeader` | Retained, works with new typography |
| `WithdrawalForm` | Retained, window status pill |
| Home dashboard | Stat cards, product grid, ledger table from Supabase |
| Admin | Operations dashboard with stats + approval queue |

All pages migrated off JSON store: `/`, `/products`, `/recharge`, `/investments`, `/profile`, `/team`, `/vip`, `/activities`, `/about`, `/settings`, `/withdraw`, `/admin`.

---

## 8. Remaining tasks

### Critical (Sprint 1)
1. **Connect Supabase project** — create project, run migration, set `.env.local`
2. **Generate full types** — `supabase gen types typescript` to replace hand-written stubs
3. **Admin role middleware** — verify `admin_roles` table, not just cookie presence
4. **Withdrawal approve/reject** — admin actions + ledger debit
5. **Investment purchase flow** — wallet debit → create investment → settlement schedule
6. **Settlement cron** — Edge Function or Vercel cron for daily accrual

### High (Sprint 2)
7. Phone OTP auth
8. Bank accounts CRUD
9. Referral commission engine
10. Supabase Storage buckets (`deposit-proofs`, `avatars`, `kyc-documents`)
11. Paystack / Flutterwave provider implementation
12. Notification persistence to `notifications` table
13. Rate limiting on API routes
14. Audit log writes on admin actions

### Medium (Sprint 3)
15. Admin analytics charts
16. KYC upload flow
17. PWA / mobile shell
18. Email transactional (Resend/SendGrid)
19. SMS (Termii/Twilio)
20. Remove `docs/reference/` from production deploy artifact

---

## 9. Production readiness percentage

| Layer | % |
|-------|---|
| Architecture & schema design | **90%** |
| Service layer foundation | **75%** |
| Auth foundation | **60%** |
| UI/UX foundation | **55%** |
| Payment integration | **15%** |
| Admin operations | **40%** |
| Investment engine (runtime) | **25%** |
| Notifications (runtime) | **10%** |
| **Overall production readiness** | **~38%** |

*Foundation phase complete. Not production-ready until Supabase is connected, migrations applied, and Sprint 1 items closed.*

---

## 10. Security score

| Control | Score (1–10) | Notes |
|---------|--------------|-------|
| RLS policies defined | 8 | Written in migration; not yet verified live |
| Auth on sensitive routes | 6 | Middleware present; admin role check incomplete |
| No secrets in client | 9 | Service role server-only |
| Input validation (API) | 7 | Zod on deposits/withdrawals |
| Audit logging | 3 | Schema only, no writes yet |
| Rate limiting | 0 | Not implemented |
| CSRF | 5 | Server actions/forms; API POST open |
| **Overall security score** | **5.5 / 10** |

---

## 11. Performance score

| Control | Score (1–10) | Notes |
|---------|--------------|-------|
| RSC usage | 8 | Most pages are Server Components |
| Code splitting | 7 | Client only where needed (auth, forms) |
| Font optimization | 9 | `next/font` Inter |
| Caching strategy | 4 | No `unstable_cache` / tags yet |
| Image optimization | N/A | No images yet |
| Bundle size | 8 | Minimal dependencies |
| **Overall performance score** | **7 / 10** |

---

## 12. Technical debt remaining

1. Hand-written `database.ts` — replace with `supabase gen types`
2. Stub table types (`vip_levels`, `referrals`, etc.) use `TableStub`
3. Middleware uses cookie name heuristic, not `getUser()` + role check
4. Deposit approval credits wallet only when `user_id` is set — guest deposits need linking flow
5. Withdrawal API still accepts `memberName`/`phone` in schema but doesn't persist them
6. Payment providers throw "not configured" — expected for foundation
7. Notification channels are no-ops — expected for foundation
8. Next.js workspace root warning (parent `package-lock.json`)
9. `middleware` deprecation warning in Next.js 16 — migrate to `proxy` convention
10. No automated tests

---

## 13. Blockers encountered

| Blocker | Impact | Resolution |
|---------|--------|------------|
| **No Supabase project connected** | App runs in degraded mode (empty data, setup banner) | User must create Supabase project + env vars |
| **Migration not applied remotely** | Schema exists only as SQL file locally | Run `supabase db push` or apply via dashboard |
| **Google OAuth** | Login button won't work until provider configured in Supabase | Dashboard → Auth → Google |
| **Service role key required** | Admin deposit approval may fail RLS without service client | Set `SUPABASE_SERVICE_ROLE_KEY` server-side |

---

## 14. Recommended next sprint

**Sprint: "Go Live on Supabase" (1 week)**

1. Create Supabase project for `altorich.com`
2. Apply `20260708160000_foundation_schema.sql`
3. Configure `.env.local` with all keys
4. Run `supabase gen types typescript --local` → replace `src/types/database.ts`
5. Create first super_admin via SQL + test admin deposit approve → wallet credit
6. Implement withdrawal approve/reject in admin
7. Wire investment purchase (wallet debit + investment row)
8. Deploy preview to Vercel with env vars
9. Point `altorich.com` DNS when ready

**Do not add new pages until Supabase is live and wallet ledger is verified end-to-end.**

---

## Setup commands

```bash
# 1. Copy environment
cp .env.local.example .env.local
# Edit with your Supabase URL + keys

# 2. Apply migration (if using Supabase CLI)
supabase link --project-ref YOUR_REF
supabase db push

# 3. Run locally
npm run dev
```

---

*Foundation phase stopped here per master instruction. Review this report before proceeding to feature sprint.*
