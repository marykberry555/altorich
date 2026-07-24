# Production Deployment Report

**Release:** Account status simplification (`active` / `paused` / `blocked`)  
**Commit:** `885294e` — *Enforce simplified account status: active, paused, blocked.*  
**Date:** 2026-07-24  
**Status:** **HOLD — migration gate** (code pushed; production deploy **not** started)

---

## Pre-deployment validation

| Check | Result |
|-------|--------|
| `npm run lint` | **PASS** (type-check + eslint, max-warnings 0) |
| `npm run type-check` | **PASS** |
| `npm test` | **PASS** — 128/128 |
| `npm run build` | **PASS** |
| Debug scan (new account-status paths) | **PASS** — no TODO/FIXME/HACK/console.log |
| Unrelated refactors | **None** |

---

## Migration review

**File:** `supabase/migrations/20260724010000_account_status_active_paused_blocked.sql`

| Criterion | Assessment |
|-----------|------------|
| Order | After existing member status / delete helpers — OK |
| Financial tables | **Not modified** (no wallets / ledger / deposits / withdrawals) |
| Destructive | Rebuilds enum via `DROP TYPE` **after** column cast — intentional, scoped to `member_account_status` only |
| Accidental DROP of money tables | **None** |
| Data normalize | `suspended` / `disabled` / `deactivated` → `blocked` on `profiles` only |
| History | Creates `account_status_history` + RLS |
| Soft-delete function | Sets `blocked` instead of `deactivated` |
| Rollback path | Recreate enum with prior labels + cast back; restore from PITR / status snapshot |

### Pre-migration data snapshot (logical backup)

Taken via service role before deploy (gitignored under `tmp/`):

- **Profiles:** 13  
- **Status counts:** `{ "active": 13 }`  
- **No paused/disabled rows** to remap at apply time  

**Automated Supabase project backup / PITR:** confirm in Dashboard → Project Settings → Database (CLI/MCP cannot access AltoRich org from this machine).

---

## Deployment blocker

| Access path | Result |
|-------------|--------|
| Supabase MCP `execute_sql` / `apply_migration` | **Denied** — MCP account does not include project `zqnuvqfzdzoxkdmcijpp` |
| `supabase db push --linked` | **Denied** — same privilege gap |
| Browser SQL Editor (automation) | Session landed on **yikeltd** org; cannot run SQL on AltoRich |

**Decision:** Do **not** deploy app code that writes `blocked` until the migration is applied on production Postgres.

Code is on `origin/main` (`885294e`) but **cPanel deploy workflow was not triggered**.

---

## Required: apply migration (manual)

1. Confirm a recent Supabase backup / PITR recovery point.  
2. Open SQL Editor for project `zqnuvqfzdzoxkdmcijpp`.  
3. Paste and run the full contents of:

`supabase/migrations/20260724010000_account_status_active_paused_blocked.sql`

4. Verify:

```sql
SELECT e.enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public' AND t.typname = 'member_account_status'
ORDER BY e.enumsortorder;
-- expect: active, paused, blocked

SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'account_status_history'
) AS history_ok;
```

5. Reply **continue deploy** (or re-run this controlled deploy). Then:

```bash
gh workflow run deploy-production.yml -f confirm=DEPLOY
```

---

## Post-deploy plan (after migration + deploy)

| Area | Checks |
|------|--------|
| Auth | Register / login / logout / reset |
| Account status | Active; paused login+deposit; paused invest/withdraw denied; blocked login denied |
| Payments | Deposit / approve / invest / withdraw / settlement / ledger |
| Admin | Status control + reason; audit / history |
| System | Health, cron, smoke, RC harness |
| Monitor | 5xx, auth, Postgres, cron, payments |

---

## Explicit non-actions this run

- Migration **not** applied  
- Production deploy workflow **not** started  
- No business-logic changes beyond already-approved commit  

**Release declaration:** Not successful yet — waiting on migration apply + deploy + verification.
