# Audit Log & Secondary-Write Resilience Review

**Status:** Local only — not committed, not pushed, not deployed. Awaiting explicit approval.  
**Date:** 2026-07-23  
**Trigger:** Payment Rails save succeeded; `audit_logs` insert with `entity_id = 'payment_rails'` failed (UUID `22P02`); user received an application error (`AR-LZEJ67`).

**Policy:** Ledger and financial state are sacred. Audit logs, notifications, analytics, and other secondary writes must never invalidate a successful primary business transaction.

---

## Final audit model (chosen design)

Not a long-term UUID coercion workaround. Explicit TEXT identifiers:

| Column | Type | Role |
|--------|------|------|
| `id` | UUID | Row id |
| `entity_type` | TEXT | Semantic kind: `deposit`, `withdrawal`, `investment`, `wallet`, `member`, `profile`, `settings`, `payment_rails`, `announcement`, `vip_level`, `system`, … |
| `entity_id` | **TEXT** | Row UUID **or** stable key: `<uuid>`, `payment_rails`, `settlement_queue`, `system`, `global`, `default` |
| `actor_id` | UUID | Performer (`performed_by` in product language; column kept as `actor_id`) |
| `action` | TEXT | What happened |
| `metadata` | JSONB | Diffs, references, context |
| `created_at` | TIMESTAMPTZ | When |

Migration (prepared, **not applied**): `supabase/migrations/20260723140000_audit_logs_entity_id_text.sql`  
Also converts `admin_notifications.entity_id` → TEXT.

App helper: `normalizeAuditEntityId` — pass-through trim (no fake UUIDs, no `metadata.entity_key` workaround).

**Deploy rule:** apply this migration **before or with** the app deploy that writes non-UUID `entity_id` values.

---

## 1. Business operations audited

| Domain | Primary operations | Secondary dependencies |
|--------|-------------------|------------------------|
| Payment Rails | Settings upsert | Audit (`entity_type/id = payment_rails`) |
| Settlement queue | Settings upsert | Audit (`settlement_queue`) |
| Feature flags / homepage / platform settings | Settings upsert | Audit |
| Funding accounts / plans | CRUD | Audit |
| Deposits | Credit → invest → complete; reject | Notify, ops events, ROI reset, route financial audit |
| Payments | Verify + wallet credit | Notify, audit, admin notify |
| Withdrawals | Status + ledger | Notify, financial audit |
| Settlements | Interest credit / auto-withdraw | Notify, cron admin alerts |
| Investments / liquidation | Purchase, stop, capital return | Notify, audit |
| Referral / VIP | Reward credit, payouts, VIP config | Notify; VIP audit via `AuditService` (was raw insert) |
| Welcome Bonus | Ledger award/unlock | Domain events (fail-soft), audit, notify |
| KYC / profile / members | Status & profile writes | Audit, notify, admin notify |
| Security / login | Telemetry | Already fail-soft |
| Analytics / metrics | **Read-only** aggregation | No write path in financial commits |
| Activity feed | Unified timeline is **derived reads** | No separate write table in money paths |

---

## 2. Secondary writer verification

Searched writers to: `audit_logs`, `admin_notifications`, `notifications`, analytics/metrics, login/security telemetry.

| Writer | Inside DB multi-statement financial txn? | Can abort primary HTTP success? |
|--------|------------------------------------------|----------------------------------|
| `AuditService.log` | No (app-level sequential calls; fail-soft) | **No** |
| Direct `audit_logs.insert` in referral VIP | **Removed** — now `AuditService` | **No** |
| `NotificationService` | After ledger steps | **No** |
| `AdminNotificationService.create` | After / alongside ops | **No** |
| `FinancialOpsService.recordEvent` | Diagnostic | **No** |
| Welcome bonus events | After award ledger | **No** |
| `recordSecurityEvent` / login activity | Auth paths | **No** |
| Analytics / live metrics | SELECT only | N/A |
| Wallet service | **No** audit/notify | N/A |

**Deposit note:** notify/ROI after `wallet_credited` run via `runSecondary` so they cannot mark workflow `failed` after money moved.

There is **no** Postgres `BEGIN…COMMIT` wrapping audit inside wallet credit RPCs in this codebase; financial integrity is enforced by ordered service calls + ledger reconciliation, with secondaries fail-soft after primary steps.

---

## 3. Fail-soft improvements

1. TEXT `entity_id` migration + `normalizeAuditEntityId` pass-through  
2. `AuditService.log` / notify / admin notify never throw; record via `recordSecondaryFailure`  
3. `runSecondary` + secondary failure buffer (diagnostics / chaos; durable outbox TBD)  
4. Deposit + payment post-commit secondaries wrapped  
5. Infrastructure error mapping for primary-path PostgREST failures  
6. Referral VIP update uses fail-soft audit service  

---

## 4. Transaction boundary review

| Flow | Verdict |
|------|---------|
| Deposit approve | Credit/phase primary; notify/ROI secondary |
| Payment credit | Wallet + deposit primary; notify/audit secondary; auto-invest failure leaves funds in wallet |
| Withdrawal / settlement / welcome bonus / liquidation | Money first; notify/audit secondary |
| Admin settings | Settings write primary; audit secondary |

---

## 5. Error classification

Validation / auth / conflict / not found / data integrity / unexpected INTERNAL (last resort). Secondaries must not surface as user-facing failures after primary success.

---

## 6. Regression + chaos tests

| Suite | Proves |
|-------|--------|
| `entity-id.test.ts` | TEXT keys stored on `entity_id` |
| `map-infrastructure-error.test.ts` | Typed AppErrors |
| `run-secondary.test.ts` | Secondary throws swallowed |
| `audit.service.test.ts` | Audit insert failure does not throw; TEXT keys persist |
| `notification.service.test.ts` | Notify/dispatch fail-soft |
| **`financial-chaos.test.ts`** | Wallet/ledger/investment “committed”; audit+notify+email forced to fail; user still gets success; secondary failure buffer populated |

---

## 7. Remaining risks

| Risk | Notes |
|------|-------|
| Migration not applied yet | Must apply before/with deploy |
| Durable retry/outbox | In-process buffer only; durable queue is follow-up |
| Deposit `failed` phase on true primary errors after partial credit | Recovery/resume workflow remains |
| Primary-path raw PostgREST throws | Continue mapping via `apiErrorResponse` |

---

## 8. Recommended deployment sequence

1. Review this diff  
2. Apply `20260723140000_audit_logs_entity_id_text.sql`  
3. Deploy the application  
4. Run RC business-flow suite against production  
5. Monitor logs/metrics 30–60 minutes (watch `Secondary operation failed` / `audit.log` labels)  
6. If clean, declare release successful  

**Explicit non-actions until you approve:** no commit, no push, no deploy, migration not applied remotely.
