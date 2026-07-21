# Alto Rich — Framework Error Elimination (Local Report)

**Status:** Ready for release candidate — edge-case recovery hardened; awaiting deploy with this release.  
**Date:** 2026-07-21

## 1. Root causes identified

1. **Aggressive boot-time cache / service-worker cleanup on every page load**  
   Nuclear `clearRuntimeCaches()` (delete all Alto caches + unregister SWs) raced with Next.js chunk fetches. That produced `ChunkLoadError` / dynamic import failures on otherwise healthy navigations and fired route / global error boundaries on every page.

2. **Member-facing copy that read like a framework failure**  
   `RouteErrorFallback` / taxonomy used phrases such as “Couldn't load this screen”, “Please continue below”, “Your money and account are safe”, and “Open login” — exactly the surface members were reporting.

3. **Global error surface depended on app providers**  
   Using themed `BrandLogo` inside `global-error.tsx` is unsafe: that file replaces the root layout, so ThemeProvider is unavailable.

4. **Offline banner implied financial uncertainty**  
   “Your account is safe” language violated the financial-safety messaging rule.

## 2. Root causes fixed

| Fix | Detail |
|-----|--------|
| Safe legacy cleanup | `clearLegacyRuntimeArtifacts()` only deletes known-legacy cache prefixes and unregisters root SWs **once per browser** (`altorich:sw-purge-v2`). |
| Nuclear clear gated | `clearRuntimeCaches()` runs only inside confirmed chunk-load recovery, once per tab session. |
| Soft landing | After recovery, navigate to a stable href (`safeRecoveryHref`) instead of reloading the broken segment (avoids loops). |
| No auto build-id reload | Build id is tracked quietly; never force-reload on mismatch. |
| Brand copy | Taxonomy + fallbacks use calm, intentional Alto Rich language. |
| Global error isolation | `global-error.tsx` is pure HTML/inline styles — no ThemeProvider, no Next Image. |

## 3. Error boundaries redesigned

- `src/components/errors/RouteErrorFallback.tsx` — premium recovery; silent auto-recover for chunk failures; soft auto-retry for transient server digests; no money-safety language; no framework wording.
- `src/app/global-error.tsx` — branded catastrophic fallback with auto chunk recovery.
- All segment `error.tsx` files continue to use `RouteErrorFallback` (root, app, site, auth, admin-app, hard).
- `src/app/not-found.tsx` — branded not-found (dashboard / home / support).
- Auth segment home/dashboard hrefs corrected to `/auth/login`.

## 4. Loading experiences improved

- Auth Suspense: `AuthPageFallback` → “Checking your account…”
- `AppLoader` accepts a `message` prop for intentional status lines.
- Member app section already uses `DashboardSkeleton` in `(app)/loading.tsx`.
- Root `loading.tsx` keeps branded `AppLoader`.

## 5. Authentication improvements

- Auth error recovery lands on `/auth/login` (not `/login` alias alone).
- Chunk recovery from `/auth/*` soft-lands on `/auth/login`.
- Auth Suspense no longer feels like a blank/framework wait.
- Sign-in CTAs use “Sign in” (never “Open login”).

## 6. Recovery mechanisms added

- One-shot chunk recovery per tab (`altorich:chunk-recovery-attempted`).
- Silent recovering UI (progress bar) while refreshing after deploy mismatch.
- Soft `reset()` once per digest for transient server errors.
- Offline: branded `/offline` page + banner without money-safety copy; connectivity probe to avoid false offline on flaky mobile networks.
- Client error reporting retained (reference id only; no stack to members in production).

## 7. Remaining edge cases

1. True backend outages will still show a branded recovery surface — expected; cannot be eliminated without inventing data.
2. First visit after a hard deploy may still one-shot recover if a stale SW was installed before this fix ships.
3. Private / strict browsers that block `sessionStorage` / `localStorage` may re-attempt cleanup more often (best-effort).
4. Form-level API messages (e.g. “Try again later” on rate limits) remain intentional business copy, not framework screens.
5. Admin/hard ops dark-tone fallbacks still use the same recovery component.

## 8. Manual testing checklist

- [ ] Hard refresh home, about, packages, learn — no error boundary flash
- [ ] Member: dashboard → wallet → deposits → withdrawals → settings → profile
- [ ] Auth: login → register → change-password Suspense feels branded
- [ ] Simulate offline (DevTools) — banner + `/offline` copy is calm; no “account is safe”
- [ ] After local build swap / cache poison: at most one silent recovery, then stable dashboard/home
- [ ] Direct visit to unknown URL — branded not-found
- [ ] Admin-app and hard-ops error paths stay dark-themed and intentional
- [ ] Confirm SW purge flag set once: `localStorage['altorich:sw-purge-v2'] === '1'`
- [ ] Confirm no infinite reload with `_cb` / `_recover` query params looping

## Constraint reminder

Approved for commit / push / deploy with the release that includes payment rails + error-experience hardening.
