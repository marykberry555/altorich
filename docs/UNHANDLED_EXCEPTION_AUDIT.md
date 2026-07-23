# Unhandled Exception Audit

**Status:** Local fixes only — **not committed, not pushed, not deployed** (awaiting explicit approval).  
**Date:** 23 July 2026  
**Incident reference:** `AR-LZEJ67` (and related INTERNAL rows)

---

## 1. Root cause

**Exact save action:** Admin **Payment rails → Save payment rails**  
**Route / mutation:** `PATCH /api/admin/payment-rails`  
**Component:** `PaymentRailsAdminPanel` (`src/components/admin/PaymentRailsAdminPanel.tsx`) → `fetch("/api/admin/payment-rails")`

### What failed

1. `PaymentRailsService.updateLiveState(...)` **succeeded** (settings were written).
2. Post-save audit logging called:

```ts
entityId: "payment_rails"
```

3. `audit_logs.entity_id` is Postgres type **UUID** (`supabase/migrations/20260708160000_foundation_schema.sql`).
4. Insert failed with:

```text
invalid input syntax for type uuid: "payment_rails" (22P02)
```

5. Supabase client returned a **PostgREST error object** (not an `Error` / `AppError`).
6. Route `catch` → `apiErrorResponse(error)` → treated as unexpected INTERNAL → member/admin UI showed:

> We're sorry — an unexpected error occurred. Our team has been notified. Your request has not been processed.

So the user saw a **failed save**, even though the payment-rails settings mutation had already completed. The exception escaped because audit used a non-UUID `entity_id` and raw PostgREST objects were not classified as expected infrastructure failures.

---

## 2. Exact stack / evidence

### Application error row

| Field | Value |
|-------|--------|
| Reference | `AR-LZEJ67` |
| Created | `2026-07-23T11:07:21.85567+00:00` |
| Code | `INTERNAL` |
| Message | `invalid input syntax for type uuid: "payment_rails" (22P02)` |
| Route | `null` (not passed into `apiErrorResponse` at the time) |

### Live reproduction (service role)

```text
INSERT audit_logs (entity_id = 'payment_rails')
→ { message: 'invalid input syntax for type uuid: "payment_rails"', code: '22P02' }

INSERT audit_logs (entity_id = null, metadata.entity_key = 'payment_rails')
→ ok
```

### Prior related INTERNAL (same class)

| Reference | Route | Message |
|-----------|--------|---------|
| `AR-B2B2FE` | `/api/deposits/[id]` | `[object Object]` (PostgREST object; deposit approve when NGN wallet missing — fixed earlier via `ensureWallet`) |
| `AR-H63M32` / `AR-YYJAAS` | null | `[object Object]` |

---

## 3. Why the exception escaped

| Layer | Behavior |
|-------|----------|
| Client | Surfaced `data.error` from 500 JSON (the generic INTERNAL copy). |
| API | `try/catch` present, but catch-all mapped **unknown** throws to INTERNAL fallback. |
| Audit | Threw on insert failure; used string settings key as UUID. |
| Classification | PostgREST `{ message, code }` was not mapped to `AppError` before today. |
| Stringification | Older path used `String(error)` → `[object Object]` for some rows. |

This was **not** a React error boundary / `error.tsx` path for the payment-rails save. It was the **API INTERNAL** payload rendered by the admin panel message line.

Global route boundaries (`RouteErrorFallback`) remain a last resort for render/chunk failures (hydration #418, ChunkLoadError) — separate from this save incident.

---

## 4. Files modified (local only)

| File | Change |
|------|--------|
| `src/lib/audit/entity-id.ts` | **New** — UUID detection + coerce non-UUID → `entityKey` |
| `src/lib/audit/entity-id.test.ts` | **New** — regression tests |
| `src/lib/errors/map-infrastructure-error.ts` | **New** — map 22P02 / 23505 / PGRST116 / RLS → `AppError` |
| `src/lib/errors/map-infrastructure-error.test.ts` | **New** — regression tests |
| `src/lib/errors/api-response.ts` | Apply infrastructure mapping before INTERNAL fallback |
| `src/services/audit/audit.service.ts` | Coerce `entity_id`; **fail-soft** on audit insert (log, don’t throw) |
| `src/app/api/admin/payment-rails/route.ts` | Route/action on errors; `settings_key` in metadata |
| `src/app/api/admin/settlement-queue/route.ts` | Same pattern for `settlement_queue` |

---

## 5. Similar issues found

| Risk | Location | Severity |
|------|----------|----------|
| Non-UUID `entityId: "settlement_queue"` | `PUT /api/admin/settlement-queue` | Same bug class as payment rails |
| Raw `if (error) throw error` PostgREST objects | Many services (wallet, deposit, etc.) | Becomes INTERNAL / historically `[object Object]` |
| Audit after successful mutation failing the HTTP response | Any `audit.log` that threw | User thinks save failed when mutation succeeded |
| Missing NGN wallet → `.single()` PGRST116 on deposit approve | Historical `AR-B2B2FE` | Previously mitigated with `ensureWallet` |
| Client hydration #418 / ChunkLoadError | Marketing + app pages | Noise in `application_errors`; not the save copy |

---

## 6. Similar issues fixed

1. **Systemic audit UUID coercion** — any non-UUID `entityId` is stored as `metadata.entity_key`, `entity_id = null`.
2. **Audit fail-soft** — audit insert failures are logged and do not fail the business response.
3. **Settlement queue save** — same string entity id class covered by coercion + metadata.
4. **Infrastructure error mapping** — common Postgres/PostgREST codes no longer fall through as opaque INTERNAL without classification.
5. Payment rails / settlement queue routes now pass `route` + `action` into `apiErrorResponse` for observability.

---

## 7. New regression tests

| Suite | Coverage |
|-------|----------|
| `src/lib/audit/entity-id.test.ts` | UUID kept; `payment_rails` / `settlement_queue` → `entityKey`; empty/null |
| `src/lib/errors/map-infrastructure-error.test.ts` | 22P02 → DATA_INTEGRITY; 23505 → CONFLICT; PGRST116 → NOT_FOUND; AppError passthrough |

All **8** tests passing locally (`npx tsx --test …`).

Suggested future tests (not required to close this incident):

- Integration: `PATCH /api/admin/payment-rails` returns 200 when audit would have previously thrown 22P02.
- API: duplicate unique constraint surfaces 409, not INTERNAL fallback copy.

---

## 8. Remaining risks

| Risk | Notes |
|------|--------|
| Hydration mismatches (#418) | Still logged via GlobalCrashReporter; not the save copy; should be tracked separately. |
| ChunkLoadError after deploy | Soft recovery exists; stale PWA tabs can still trip boundaries. |
| Services that `throw error` without reaching `apiErrorResponse` | Server Actions / unwrapped paths — prefer wrapping with `withApiHandler` / try-catch. |
| `Errors.internal()` call sites | Still intentionally emit the global copy for true unknowns — correct as last resort. |
| Settings already saved on prior failed UI | Admins who hit `AR-LZEJ67` may already have rails saved; re-open page to confirm before re-saving. |

---

## 9. Recommendation

1. **Approve local review**, then commit / deploy this fix set deliberately (you previously forbade deploy until approval).
2. Smoke in production after deploy:
   - Admin → Payment rails → toggle → **Save** → expect success toast, no generic INTERNAL copy.
   - Admin → Settlement queue config save.
3. Keep the generic INTERNAL message as a **last-resort** safety net; do not delete it.
4. Continue converting raw `throw supabaseError` in money paths to `AppError` at the service boundary where business meaning is known.
5. Triage hydration #418 as a separate UX/SSR ticket (not this save incident).

---

## Incident completion checklist

- [x] Original issue reproduced (`22P02` on `entity_id = "payment_rails"`).
- [x] Exact save action identified (**Save payment rails** / `PATCH /api/admin/payment-rails`).
- [x] Root cause identified (UUID column + string settings key + unclassified PostgREST throw).
- [x] Root cause fixed locally (coerce + fail-soft audit + infrastructure mapping).
- [x] Similar failure (`settlement_queue`) eliminated via same audit path.
- [x] Regression tests added and passing.
- [x] This report written.
- [ ] **Not committed / not pushed / not deployed** — awaiting your explicit approval.
