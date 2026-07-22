# AltoRich — Release Readiness Report

**Date:** 22 July 2026  
**Audit type:** Operational Readiness (pre-deployment)  
**Scope:** Observability, backups, security, performance, configuration, deployment  
**Business-flow RC:** Run `mrvlat9d` — **40/40 PASS** (local)  
**Ledger integrity:** **6/6 PASS** (global)  
**Local changes:** Uncommitted (~27 files) — **not deployed**

---

## Final Verdict

# READY AFTER CHECKLIST

The platform’s **financial workflows are functionally correct** and were executed end-to-end with real API + database operations. Operational gaps remain that must be closed before handling live customer funds. **Do not deploy until the deployment checklist (§8) is completed and signed off.**

---

## 1. Verification Summary

| Area | Result | Notes |
|------|--------|-------|
| Member lifecycle (register → deposit → invest) | **PASS** | Fresh account, OTP verify, ₦35k auto-invest |
| Admin deposit approve/reject | **PASS** | Wallet credit, audit trail, notifications |
| Withdrawal lifecycle | **PASS** | Submit → approve → paid; balances reconciled |
| Referral + commission | **PASS** | ₦1,050 commission on referred ₦35k invest |
| Welcome bonus | **PASS** | Locked WB wallet; early withdrawal blocked |
| Payment idempotency | **PASS** | Duplicate key returns same deposit |
| Ledger integrity | **PASS** | 26 wallets, no duplicate refs |
| Observability (member-facing) | **PASS** | 5xx sanitized; `referenceId` returned |
| Observability (operator correlation) | **PARTIAL** | No request-ID middleware; sparse route/user context |
| Security (money movement IDOR) | **PASS** | Deposits/withdrawals scoped correctly |
| Security (credential exposure) | **FAIL** | `pin_hash` readable via RLS + PATCH response |
| Security (admin finance roles) | **PARTIAL** | Any admin role can approve deposits/pay withdrawals |
| Configuration (local) | **PASS** | `/api/health/ready` → 200 |
| Performance (local dev) | **PARTIAL** | Cold-start skew; see §5 |
| Production deploy | **PENDING** | Local fixes not committed or deployed |

---

## 2. What Changed (Local, Uncommitted)

### Navigation & stability incident

| File | Change |
|------|--------|
| `src/lib/cache/chunk-recovery.ts` | `safeRecoveryHref` preserves current route instead of forcing `/dashboard` |
| `src/components/pwa/ChunkLoadRecovery.tsx` | Sibling tabs reload own pathname, not broadcast target |
| `src/lib/cache/chunk-recovery.test.ts` | Updated expectations |

### Dashboard restore & dead code removal

| File | Change |
|------|--------|
| `src/components/dashboard/DashboardShell.tsx` | Removed `IncidentBanner` |
| Deleted | `DashboardQuickActions`, `DashboardSmartAlerts`, `DashboardActivityTimeline`, `smart-alerts.ts`, member-experience dashboard widgets |

### Admin & API stability

| File | Change |
|------|--------|
| `src/components/admin-ops/DepositReviewWorkspace.tsx` | PATCH + JSON approve/reject |
| `src/app/api/deposits/[id]/route.ts` | JSON response for admin-app |
| `src/app/api/admin/deposits/route.ts` | Per-row fault isolation |
| `src/lib/api/route-handler.ts` | Uniform API error wrapper (ROI routes) |
| `src/app/admin-app/(ops)/layout.tsx` | try/catch on admin role probe |
| `src/services/admin/financial-ops.service.ts` | Query failure logging |

### Hydration fix

| File | Change |
|------|--------|
| `src/components/payout/PayoutScheduleCard.tsx` | Countdown renders after client hydration |

### Verification tooling (new)

| File | Purpose |
|------|---------|
| `scripts/rc-business-flows.mjs` | Full RC business-flow validation |
| `scripts/ops-perf-audit.mjs` | Performance measurement |
| `scripts/verify-ledger-integrity.mjs` | Global ledger reconciliation |
| `e2e/incident-verification.spec.ts` | Playwright navigation regression |

**Already deployed:** Dashboard layout rollback (`6c119d7`). **Not yet deployed:** Navigation fix and admin deposit workflow fixes above.

---

## 3. Bugs Fixed (Pending Deploy)

| ID | Bug | Fix | Verified |
|----|-----|-----|----------|
| NAV-1 | All member routes recovered to `/dashboard` on chunk error | Route-preserving recovery | Programmatic + browser |
| ADM-1 | Admin deposit approve used form POST → HTML redirect | PATCH + JSON | Playwright + RC script |
| ADM-2 | Admin deposit list all-or-nothing on enrichment failure | Per-row try/catch | API test |
| ADM-3 | Admin layout crash on RPC failure | try/catch redirect | Code review |
| ROI-1 | Unhandled exceptions on ROI API routes | `withApiHandler` | Code review |
| HY-1 | Withdrawals page hydration mismatch | Client-only countdown | Browser |

---

## 4. Known Limitations

1. **Auto-invest minimums** — Deposits below portfolio minimum stay in wallet with “top up to invest” notification (by design).
2. **Welcome bonus** — Locked in WB wallet until qualification period ends; not spendable NGN.
3. **Manual payment rails** — Bank/crypto deposits require admin verification; no live Paystack/Flutterwave gateway.
4. **In-memory rate limiting** — Does not span multiple server instances; Redis recommended for scale.
5. **CSRF** — No token-based CSRF; mitigated by `SameSite=Lax` session cookies + JSON APIs.
6. **Member SW kill-switch** — `public/sw.js` unregisters legacy SW; admin PWA has its own SW.
7. **Production nav bug** — Chunk-recovery fix is local-only until deploy.

---

## 5. Observability Audit

### What works

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Structured JSON logging | **PASS** | `src/lib/logger.ts` — timestamp, level, service |
| Error classification | **PASS** | `src/lib/errors/taxonomy.ts` |
| Users never see raw 5xx | **PASS** | `src/lib/errors/api-response.ts` — generic message + `referenceId` |
| Stack traces stored server-side | **PASS** | `application_errors.stack` (8k truncate) |
| Admin error review | **PASS** | `/api/admin/errors`, `application_errors` table |
| Client error ingest | **PASS** | `/api/client-error` with session user |
| RLS/permission errors sanitized | **PASS** | Generic message, no policy text leaked |

### Gaps (operational, not member-facing)

| Gap | Severity | Detail |
|-----|----------|--------|
| **No request-ID middleware** | High | Schema supports `request_id`; never generated in `middleware.ts` |
| **Route/userId rarely passed to `apiErrorResponse`** | High | ~83 routes use bare `apiErrorResponse(error)` |
| **Stack not in console logs** | Medium | Stored in DB but omitted from `logger.error` payload |
| **15 API routes unwrapped** | Medium | Health/cron/contact — unhandled throws skip `referenceId` |
| **Cron 500 leaks `detail`** | Medium | `src/app/api/cron/*/route.ts` returns internal message |
| **Silent catch blocks** | Low | `homepage/stats`, `social/live-activity` return fallbacks without logging |
| **503 NOT_CONFIGURED not logged** | Low | Returns gracefully but no operator log |

### Recommendation (pre/post deploy)

1. Add `x-request-id` generation in middleware; propagate to `apiErrorResponse`.
2. Extend `withApiHandler` to auto-bind route + session userId.
3. Sanitize cron 500 responses (log internally only).
4. Add `logger.warn` to silent fallback catch blocks.

**Member safety:** Users do **not** see stack traces or internal error strings on wrapped routes. **Operator debuggability** is the gap.

---

## 6. Backups & Recovery Plan

### Supabase database

| Item | Plan |
|------|------|
| **Backups** | Enable Supabase **Pro daily backups** (or confirm on production project dashboard → Settings → Database → Backups). Point-in-time recovery (PITR) recommended for financial workloads. |
| **Migrations** | 38 migrations in `supabase/migrations/`. Apply with `supabase db push` before deploy. |
| **Rollback (schema)** | Revert migration via new forward migration — **never** delete applied migrations. For emergency: restore from Supabase backup snapshot. |
| **Rollback (data)** | Use Supabase dashboard → Database → Backups → Restore. Test restore procedure on staging first. |

### Storage (Supabase Storage)

| Bucket | Content | Backup |
|--------|---------|--------|
| Deposit proofs | Member upload receipts | Supabase Storage inherits project backup; verify bucket policies in `20260708170000_sprint1_storage_security.sql` |
| Avatars / KYC | Member documents | Same; RLS owner-scoped |

### Environment variable recovery

| Store | Location | Recovery |
|-------|----------|----------|
| Production secrets | `.env.production` on cPanel **or** cPanel Node env UI | Keep encrypted offline copy (1Password/Vault); template in `.env.local.example`, `deploy/env.production.example` |
| Supabase keys | Supabase dashboard → Settings → API | Regenerate if compromised; update server env + restart |
| CRON_SECRET | Server env only | Rotate + update external cron caller |
| RESEND_API_KEY | Resend dashboard | Rotate if compromised |

### Application rollback

```bash
# 1. Identify last good commit
git log --oneline -10

# 2. On server (cPanel) — checkout previous release tag/commit
git fetch && git checkout <previous-sha>

# 3. Rebuild and restart
bash scripts/deploy/build-cpanel.sh
# Passenger/cPanel restart via UI or touch tmp/restart.txt

# 4. Verify
curl -s https://altorich.com/api/health/ready
curl -s https://altorich.com/api/build-id
node scripts/deploy/release-gate.mjs   # if available
```

### Build rollback

- `.next/` is rebuilt each deploy — rollback = redeploy previous git SHA.
- Cloudflare CDN: run `scripts/deploy/purge-cloudflare-cache.sh` after rollback.
- `CDN-Cache-Control: no-store` on dynamic routes limits stale HTML risk.

### Financial recovery cron

- **`POST /api/cron/deposit-recovery`** — Resumes stuck deposit workflows (run every 5–15 min).
- Manual admin alternative: re-approve via admin deposits workspace.

---

## 7. Security Audit

| Control | Result | Notes |
|---------|--------|-------|
| RLS on financial tables | **PASS** | Deposits, withdrawals, wallets, investments protected |
| Direct member INSERT removed | **PASS** | `20260717223000_launch_security_money_hardening.sql` |
| Service role server-only | **PASS** | Never in client bundle |
| IDOR (deposits/withdrawals/members) | **PASS** | Session-scoped or admin-gated |
| Admin UI middleware | **PASS** | `has_admin_role()` on `/admin-app/*` |
| XSS surface | **PASS** | JSON-LD only `dangerouslySetInnerHTML`; admin text sanitized |
| Auth rate limiting | **PASS** | Login, register, OTP limited |
| Bot blocking | **PASS** | Headless/scraper UAs blocked at edge |
| **`pin_hash` exposure** | **FAIL** | RLS allows own-row SELECT of `pin_hash`; `updateProfile` `.select()` returns full row |
| **`settlement_reference_counters` RLS** | **FAIL** | No RLS policy |
| **Finance role at API layer** | **PARTIAL** | `requireAdmin()` without finance-role check on deposit approve / withdrawal pay |
| **Financial POST rate limits** | **FAIL** | `/api/deposits`, `/withdrawals`, `/investments` unbounded |
| **Upload magic-byte validation** | **PARTIAL** | MIME allowlist only on deposit proofs |
| **CSRF tokens** | **N/A** | SameSite=Lax documented limitation |
| **Cron error detail leak** | **FAIL** | Internal message in JSON `detail` field |

### Pre-deploy security checklist

- [ ] Strip `pin_hash` from member-readable SELECT (view or column revoke)
- [ ] Fix `ProfileService.updateProfile` / `updateNotificationPreferences` to explicit safe columns
- [ ] Add RLS to `settlement_reference_counters`
- [ ] Enforce finance role on money-moving admin APIs
- [ ] Add rate limits on financial POST endpoints
- [ ] Remove `detail` from cron 500 responses

---

## 8. Performance Audit

**Environment:** Local dev (`npm run dev`), cold-ish server. Limits are aspirational production targets.

| Endpoint / Page | Measured | Limit | Result |
|-----------------|----------|-------|--------|
| POST /api/deposits (submit) | 3,498 ms | 8,000 ms | **PASS** |
| Admin deposits page | 1,937 ms | 3,000 ms | **PASS** |
| Member login API | 6,390 ms | 1,500 ms | FAIL (cold) |
| Admin login API | 3,805 ms | 1,500 ms | FAIL (cold) |
| GET /api/admin/deposits | 3,602 ms | 1,500 ms | FAIL (cold) |
| GET /api/admin/financial-health | 4,390 ms | 1,500 ms | FAIL (cold) |
| Member dashboard page | 9,923 ms | 3,000 ms | FAIL (cold RSC compile) |
| Member wallet page | 4,766 ms | 3,000 ms | FAIL (cold) |

**Largest API responses:** admin deposits queue (~2.6 KB), financial-health (~1.6 KB), member deposits (~1.4 KB). All acceptable sizes.

**Assessment:** Local dev first-hit latency is dominated by Next.js compilation. Production webpack build with warm instances should be significantly faster. **Re-measure on production after deploy** using `scripts/ops-perf-audit.mjs` with `PLAYWRIGHT_BASE_URL=https://altorich.com`.

**No slow-query instrumentation** is built into the app. Monitor via Supabase dashboard → Database → Query Performance after launch.

---

## 9. Configuration Audit

### Required environment variables

| Variable | Required | Missing behaviour |
|----------|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes (prod)** | Startup throw via `instrumentation.ts` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes (prod)** | Startup throw |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes (prod)** | Startup throw |
| `NEXT_PUBLIC_SITE_URL` | **Yes (readiness)** | `/api/health/ready` → 503 degraded |
| `CRON_SECRET` | **Yes (readiness + crons)** | Crons return 401; readiness 503 |
| `RESEND_API_KEY` | **Recommended** | Email skipped; `sendEmail()` may report success anyway |
| `ADMIN_VAPID_*` | Optional | Admin push disabled |
| `NEXT_PUBLIC_ROI_MODE_ENABLED` | Optional | Legacy ROI routes disabled |

**Local readiness probe (22 Jul 2026):** `/api/health/ready` → `200 ready`, all checks true.

### Graceful degradation verified

| Scenario | Behaviour |
|----------|-----------|
| Missing Supabase (production) | Process exit at startup |
| Missing Supabase (dev) | Amber banner; pages load |
| Missing service role in API | `{ code: "NOT_CONFIGURED" }` 503 |
| Missing CRON_SECRET | Cron endpoints 401 |
| Unauthenticated protected route | 307 → login |

---

## 10. Deployment Checklist

Complete **every item** before production deploy.

### Pre-deploy

- [ ] Review and approve uncommitted diff (~27 files)
- [ ] `npm run type-check && npm run lint && npm run build`
- [ ] `supabase db push` — apply any pending migrations (43 files in repo)
- [ ] `npm run verify:db && npm run verify:rls`
- [ ] Confirm Supabase **daily backups** enabled on production project
- [ ] Store `.env.production` secrets in secure vault

### Environment variables (production server)

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_SITE_URL` (exact production URL with `https://`)
- [ ] `CRON_SECRET` (strong random, ≥32 chars)
- [ ] `RESEND_API_KEY` + verified sending domain
- [ ] Optional: `ADMIN_VAPID_PUBLIC_KEY`, `ADMIN_VAPID_PRIVATE_KEY`

### External cron jobs (required — not in repo)

All `POST` with `Authorization: Bearer $CRON_SECRET`:

| Schedule | Endpoint | Purpose |
|----------|----------|---------|
| Monday ~09:00 WAT | `/api/cron/weekly-settlements` | Settlements, welcome-bonus unlock, summary emails |
| Every 5–15 min | `/api/cron/deposit-recovery` | Stuck deposit workflow recovery |
| Hourly or daily | `/api/cron/financial-alerts` | Financial health alerts to admins |

### Supabase

- [ ] Migrations applied
- [ ] RLS enabled on all public tables
- [ ] Storage buckets: deposit proofs, avatars, KYC
- [ ] Auth email templates / redirect URLs match `NEXT_PUBLIC_SITE_URL`

### Admin settings (database, not env)

- [ ] Bank funding accounts configured
- [ ] Crypto payment rails configured (if enabled)
- [ ] Welcome bonus programme settings
- [ ] Referral / VIP levels

### Email

- [ ] Resend domain verified for `hello@altorich.com`
- [ ] Test registration verification email
- [ ] Test device OTP email

### CDN / caching

- [ ] Cloudflare DNS pointing to origin
- [ ] Post-deploy cache purge (`scripts/deploy/purge-cloudflare-cache.sh`)
- [ ] Verify `CDN-Cache-Control: no-store` on authenticated pages

### Service worker

- [ ] Member `public/sw.js` kill-switch deployed (prevents chunk-loop)
- [ ] Admin PWA `public/admin-app/sw.js` + manifest accessible

### Deploy execution

```bash
# Unified (migrations + git + cPanel)
./deploy.sh

# Or cPanel only
./deploy.sh cpanel
```

- [ ] GitHub Actions deploy (if used): manual `DEPLOY` confirmation
- [ ] Post-deploy: `node scripts/deploy/verify-deploy.sh`
- [ ] Post-deploy: release gate script passes

### Security (P0 before live funds)

- [ ] Fix `pin_hash` exposure (see §7)
- [ ] Finance-role enforcement on admin money APIs
- [ ] Rate limits on financial POST endpoints

### Observability (recommended)

- [ ] Request-ID middleware
- [ ] Confirm `/api/admin/errors` accessible to super admins
- [ ] Monitor `application_errors` table post-launch

---

## 11. Production Smoke Tests

Run **after deploy** against `https://altorich.com`:

```bash
# Health
curl -s https://altorich.com/api/health/ready | jq .
curl -s https://altorich.com/api/health/env | jq .

# Release gate (if configured)
RELEASE_GATE_BASE_URL=https://altorich.com node scripts/deploy/release-gate.mjs

# Full business flows (use isolated test accounts)
PLAYWRIGHT_BASE_URL=https://altorich.com node scripts/rc-business-flows.mjs

# Ledger
node scripts/verify-ledger-integrity.mjs

# Performance (warm)
PLAYWRIGHT_BASE_URL=https://altorich.com node scripts/ops-perf-audit.mjs
```

### Manual smoke (5 minutes)

1. **Member nav** — Login as test member → visit `/deposits`, `/wallet`, `/portfolio` — must **not** redirect to dashboard.
2. **Admin deposits** — Login as admin → approve a test deposit → confirm wallet credit.
3. **Error surface** — Trigger a validation error (bad form) → confirm user-friendly message, no stack trace.
4. **Cron** — `curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://altorich.com/api/cron/deposit-recovery` → 200.
5. **Email** — Register test account → verification email received.

---

## 12. Rollback Plan

| Trigger | Action | Time estimate |
|---------|--------|---------------|
| Deploy breaks site | Revert git SHA + rebuild (`§6 Application rollback`) | 10–20 min |
| Bad migration | Forward-fix migration OR Supabase backup restore | 30 min – 2 hr |
| Financial duplicate credit | Stop cron; use admin audit + `financial_ops_events`; manual adjustment via admin wallet tools | Case-by-case |
| Secret compromise | Rotate keys in Supabase/Resend; redeploy env; force member re-login | 30 min |

**Rollback owner:** Platform admin with cPanel + Supabase dashboard access.

---

## 13. Scores

| Metric | Score | Basis |
|--------|-------|-------|
| RC Business Flows | **100 / 100** | 40/40 (run `mrvlat9d`) |
| Ledger Integrity | **100 / 100** | 6/6 checks |
| Observability (member) | **90 / 100** | Sanitized errors; reference IDs |
| Observability (operator) | **55 / 100** | No request ID; sparse context |
| Security (money movement) | **85 / 100** | IDOR/RLS solid; role + pin gaps |
| Configuration readiness | **95 / 100** | Local ready; cron external |
| Performance (unverified prod) | **70 / 100** | Dev cold-start; prod TBD |
| **Overall operational readiness** | **READY AFTER CHECKLIST** | See §10 |

---

## 14. Sign-Off

| Role | Name | Date | Approved |
|------|------|------|----------|
| Platform owner | | | ☐ |
| Engineering | | | ☐ |
| Operations | | | ☐ |

**Do not deploy to production until §10 checklist is complete and §11 smoke tests pass.**

---

*Generated by operational readiness audit — 22 July 2026. Evidence: `test-results/rc-flows/rc-report-mrvlat9d.json`, `test-results/ops-perf/perf-report.json`.*
