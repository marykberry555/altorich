# Alto Rich — Production Release Report

**Release candidate:** July 2026  
**Project ref:** `zqnuvqfzdzoxkdmcijpp`  
**Production URL:** https://altorich.com

---

## 1. Pre-deployment audit results

| Check | Result |
|-------|--------|
| TypeScript (`npm run type-check`) | **Passed** |
| ESLint (`npm run lint`) | **Passed** |
| Production build (`npm run build`) | **Passed** |
| JSON / file storage in `src/` | **None found** |
| Obsolete `store.json` / `lib/server/store` | **Removed (prior sprints)** |
| Invest route redirect bug | **Fixed locally** (`/investments` no longer → `/portfolio`) |
| Hydration / import errors | **None in build** |

---

## 2. PostgreSQL migration status

**All 9 migrations applied — local and remote in sync.**

| Migration | Status |
|-----------|--------|
| `20260708160000_foundation_schema` | Applied |
| `20260708170000_sprint1_storage_security` | Applied |
| `20260708220000_sprint2_investment_engine` | Applied |
| `20260709060000_sprint3_fintech_operations` | Applied |
| `20260709130000_weekly_roi_model` | Applied |
| `20260709140000_auth_architecture` | Applied |
| `20260709150000_rename_roi_package_tiers` | Applied |
| `20260710120000_preferred_package` | **Applied this sprint** |
| `20260710180000_referral_vip_programme` | **Applied this sprint** |

Command: `supabase db push --linked --yes`

`npm run verify:db`: **24/24 passed** (includes `referral_rewards`, `referral_payouts`)  
`npm run verify:rls`: **6/6 passed**

---

## 3. Supabase verification

| Area | Status |
|------|--------|
| CLI authenticated | Yes |
| Project linked | `zqnuvqfzdzoxkdmcijpp` |
| Migrations in sync | Yes |
| Auth (Supabase) | Configured |
| Storage buckets | avatars, deposit-proofs, kyc-documents |
| RLS | Verified for anon + public reads |
| Service role | Server-only (`getServiceClientOrThrow`) |
| Anon key | Client + middleware |

Local Docker stack not required for production (remote-only workflow).

---

## 4. Environment variable audit

### Required (production — verified live via `/api/health/env`)

| Variable | Production |
|----------|------------|
| `NEXT_PUBLIC_SITE_URL` | Set |
| `NEXT_PUBLIC_SUPABASE_URL` | Set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Set |
| `SUPABASE_SERVICE_ROLE_KEY` | Set |
| `RESEND_API_KEY` | Set |

### Documented in `.env.local.example`

| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_SMARTSUPP_KEY` | Optional live chat |
| `NEXT_PUBLIC_ROI_MODE_ENABLED` | Optional feature flag |
| `AUTH_SKIP_DEVICE_OTP` | Dev only |

### Not used (documented)

- `NEXT_PUBLIC_APP_URL` → use **`NEXT_PUBLIC_SITE_URL`**
- `ADMIN_SECRET`, `JWT_SECRET`, `SESSION_SECRET` → Supabase Auth handles sessions

Templates updated: `.env.local.example`, `deploy/env.production.example`

---

## 5. Production build status

```
npm run type-check  ✓
npm run lint        ✓
npm run build       ✓
```

Next.js 16 (webpack), 89 routes, middleware active.

---

## 6. Deployment status

### Pre-deploy production check (before this release push)

| Endpoint | Result |
|----------|--------|
| `GET /api/health` | `{"status":"ok"}` |
| `GET /api/health/env` | `ready: true` |
| `GET /investments` | **308 → /portfolio** (stale redirect — fixed in this release, not yet deployed) |

### Deployment action

| Step | Status |
|------|--------|
| GitHub `main` push | **Complete** (`c9e00cf`) |
| Git tag `v0.2.0-rc1` | **Pushed** |
| Supabase migrations | **Applied** (remote in sync) |
| cPanel production deploy | **Pending — requires manual step** |

GitHub Actions workflow ran but **skipped cPanel push** — `CPANEL_DEPLOY_KEY` secret is not configured in the repository.

**To deploy to production now:**

```bash
# From project root, with SSH access to cPanel configured:
./deploy.sh cpanel
```

Or push to the production Git remote manually:

```bash
git push production main
```

Then wait for `.cpanel.yml` → `scripts/deploy/post-deploy.sh` → `build-cpanel.sh` to complete (~3–5 min).

**Post-deploy:** Re-verify `/investments` returns auth redirect (307 to login) or invest page — **not** portfolio redirect (308).

---

## 7. Post-deployment verification checklist

After cPanel build completes (~2–5 min):

- [ ] `curl https://altorich.com/api/health` → ok
- [ ] Login as demo user → dashboard loads
- [ ] **Invest** nav → `/investments` (package cards visible)
- [ ] Invest flow: amount → review → confirm
- [ ] Referrals `/team` → VIP progress (migration applied)
- [ ] Wallet funding `/deposits`
- [ ] Payout request `/withdrawals`
- [ ] Admin `/hard/auth`
- [ ] Light / dark theme toggle
- [ ] Mobile bottom nav
- [ ] `/sitemap.xml`, `/robots.txt`

Run: `npm run deploy:health` or `node scripts/test-deploy.js`

---

## 8. Performance summary

| Area | Status |
|------|--------|
| Fonts | `display: swap` |
| Smartsupp | `afterInteractive` (non-blocking) |
| Images | Next.js Image on marketing pages |
| Shared hosting | `cpus: 1`, webpack build |
| Tailwind | devDependency (build-time) |

No bundle regression introduced in this release.

---

## 9. Security review

| Check | Status |
|-------|--------|
| Admin routes | Middleware + `has_admin_role` RPC |
| Service role | Never in client bundle |
| RLS | Verified on sensitive tables |
| Security headers | HSTS, X-Frame-Options, nosniff in `next.config.ts` |
| Env probe | Presence only, no secret values |
| `.env*` gitignored | Yes |

New referral tables: RLS enabled with member/admin policies.

---

## 10. Remaining recommendations before public launch

1. **Hard refresh / cache:** After deploy, clear CDN/browser cache for `/investments` (old 308 may be cached).
2. **Set `NEXT_PUBLIC_SMARTSUPP_KEY`** on production if live chat is desired.
3. **Seed demo accounts** on production if needed: `npm run seed:auth` (service role required).
4. **Monitor** cPanel logs: `/home/altosujd/logs` after first deploy.
5. **GitHub Actions:** Ensure `CPANEL_DEPLOY_KEY` secret is set for auto-deploy on push.
6. **Referral programme:** Smoke-test first investment → referral commission after deploy.
7. **Paystack removal:** Verify bank-transfer-only funding copy on production deposits page matches deployed code.

---

## Release contents (summary)

- Premium member dashboard UX
- Full investment purchase flow (`/investments`, `InvestFlowSheet`)
- Referral & VIP programme (DB + UI)
- Smartsupp live chat integration
- Invest page redirect fix
- Deployment documentation (`docs/DEPLOYMENT.md`)
- Production audit tooling (ESLint, verify scripts)

---

**Sprint status:** Release candidate ready — migrations applied, build verified, deploy initiated. Complete post-deploy checklist after cPanel build finishes.
