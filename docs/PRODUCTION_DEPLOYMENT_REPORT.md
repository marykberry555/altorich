# Production Deployment Report

**Release:** Account status simplification (`active` / `paused` / `blocked`)  
**Commits:** `885294e` (feature) → `efe5473` (hold doc)  
**Deploy workflow:** [30075588735](https://github.com/marykberry555/altorich/actions/runs/30075588735)  
**Live BUILD_ID:** `KOhRaTUqaTDj8RmG-OPlX`  
**Date:** 2026-07-24  
**Status:** **RELEASE SUCCESSFUL** (begin observation window)

---

## Deployment summary

| Step | Result |
|------|--------|
| Pre-deploy lint / type-check / test / build | **PASS** (128 tests) |
| Logical status snapshot (pre-migration) | **PASS** — 13 profiles, all `active` |
| Migration `account_status_active_paused_blocked` | **PASS** (verified live: enum accepts `blocked`; `account_status_history` readable) |
| Push to `origin/main` | **PASS** |
| GitHub Actions production deploy | **PASS** — [30075588735](https://github.com/marykberry555/altorich/actions/runs/30075588735) |
| cPanel background build swap | **PASS** — BUILD_ID `k2vBbUhp0vQOG_Cco3xwV` → `KOhRaTUqaTDj8RmG-OPlX` |
| Health `/api/health` | **PASS** — `status: ok` |
| Readiness `/api/health/ready` | **PASS** — all checks true |

### Transient during build

Workflow health step can succeed against the previous Node process while `deploy-production.sh` still builds. During swap, `/packages` and `/admin/auth` briefly returned HTTP 500, then recovered when the new BUILD_ID went live (~2 minutes after workflow success).

---

## Migrations applied

**File:** `supabase/migrations/20260724010000_account_status_active_paused_blocked.sql`

| Change | Status |
|--------|--------|
| Enum → `active \| paused \| blocked` | **Live** |
| Normalize legacy lockout statuses → `blocked` | **N/A data** (all rows were already `active`) |
| `account_status_history` + RLS | **Live** |
| Soft-delete helper uses `blocked` | **Applied** |
| Financial ledger tables | **Untouched** |

**Rollback:** PITR / recreate prior enum labels + cast; restore status snapshot from `tmp/account_status_backup_*.json` if needed.

---

## Verification results

| Suite | Result |
|-------|--------|
| Production smoke | **PASS** — **28/28** |
| Ledger integrity | **PASS** — **6/6** |
| Release gate | **PASS** — **18/18** |
| Account-status unit tests | **PASS** — **13/13** |
| DB probe (`blocked` write + history select) | **PASS** |

### Smoke coverage (live)

Homepage · health · auth redirects · login/packages/download · admin auth/install/download · protected APIs · security headers · live activity

### Not re-run this pass

Full RC business-flows harness (registration → deposit → withdraw → referral → WB) — prior release was 40/40; this release is authorization/policy-focused. Spot-check account status in admin after deploy if desired.

---

## Account status (production behavior)

| Status | Expected |
|--------|----------|
| Active | Full access |
| Paused | Login + deposits; invest/withdraw/earn blocked; banner: *Your account is temporarily under review.* |
| Blocked | No login; sessions revoked; ignored by cron |

Current profile distribution after deploy: **13 active**.

---

## Production health

- App: healthy + ready  
- BUILD_ID: `KOhRaTUqaTDj8RmG-OPlX`  
- Ledger: reconciled  
- No deploy-time financial integrity failures detected  

---

## Issues encountered

| Issue | Resolution |
|-------|------------|
| Initial HOLD — no DDL access via MCP/CLI | Migration applied out-of-band; verified before continue-deploy |
| Workflow “health OK” before BUILD_ID swap | Polled until new BUILD_ID; smoke re-run clean |
| Brief 500s on `/packages`, `/admin/auth` during restart | Self-resolved with new build |

---

## Monitoring (recommended 60 minutes)

**Started:** ~2026-07-24T07:33Z  
**Watch through:** ~2026-07-24T08:33Z  

Watch for: HTTP 5xx, auth failures, Postgres/PostgREST errors, cron failures, payment failures, unhandled exceptions, performance degradation. Especially admin status changes (pause/block) and paused-member deposit vs invest paths.

---

## Success criteria

| Criterion | Met |
|-----------|-----|
| Health checks pass | **Yes** |
| Smoke tests pass | **Yes** (28/28) |
| No financial integrity issues | **Yes** (ledger 6/6) |
| No unexpected DB errors on status model | **Yes** |
| Server errors after swap | **None observed** in gate/smoke |

**Release declaration:** Successful. Begin observation window.
