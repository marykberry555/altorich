# Production Deployment Audit Report

**Date:** July 2026  
**Scope:** Startup, package.json, Node.js, PostgreSQL migration, env vars, build, deployment compatibility, performance, security, cleanup

---

## 1. Startup configuration verified

| Mode | Command | When to use |
|------|---------|-------------|
| **Standard Next.js** | `npm run build` → `npm start` | Vercel, Docker, most Node hosts |
| **cPanel / Passenger** | `npm run build` → `npm run start:cpanel` | Namecheap Node.js hosting |

**Finding:** AltoRich is a standard Next.js 16 App Router app. The default production flow is `next start`.

**Decision:** `server.js` **retained** — it is required for Namecheap/cPanel Phusion Passenger (documented in `docs/DEPLOYMENT.md`). It is not used by Vercel or standard `npm start`.

`server.js` responsibilities:
- Loads `.env.production` via `scripts/deploy/load-env.js`
- Wraps Next.js in a Node HTTP server for Passenger
- Logs errors to cPanel log directory

`src/instrumentation.ts` validates required Supabase env vars on Node.js startup in production.

---

## 2. package.json audited

### Scripts verified

| Script | Status |
|--------|--------|
| `npm install` | OK |
| `npm run build` | OK (`next build --webpack`) |
| `npm start` | OK (`next start`) |
| `npm run start:cpanel` | OK (cPanel only) |
| `npm run lint` | Updated — type-check + ESLint |
| `npm run type-check` | OK |

### Dependencies cleaned

| Change | Reason |
|--------|--------|
| Moved `tailwindcss`, `@tailwindcss/postcss` to `devDependencies` | Build-time only — not needed at runtime |
| Added `eslint.config.mjs` | ESLint 9 flat config for Next.js |
| Added `.nvmrc` (22) | Matches cPanel build script default |

### No unused runtime dependencies found

All production dependencies are used: Next.js, React, Supabase, Recharts, Zod, Lucide, clsx, tailwind-merge.

---

## 3. Node.js compatibility verified

```json
"engines": {
  "node": "20.x || 22.x",
  "npm": ">=10"
}
```

| Platform | Supported |
|----------|-----------|
| Node 20 LTS | Yes |
| Node 22 LTS | Yes (cPanel default) |
| Next.js 16 | Yes |
| React 19 | Yes |
| Supabase JS v2 | Yes |

---

## 4. PostgreSQL migration verified

**Status: Fully migrated to Supabase PostgreSQL.**

| Check | Result |
|-------|--------|
| `data/store.json` | Not present |
| `src/lib/server/store.ts` | Not present |
| File-based persistence in `src/` | None |
| Filesystem writes in app code | None (deploy scripts only) |

All data access goes through Supabase client + service layer (`src/services/`).

---

## 5. Environment variables audited

### Required (production)

| Variable | In `.env.local.example` | Validated at startup |
|----------|-------------------------|----------------------|
| `NEXT_PUBLIC_SITE_URL` | Yes | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Yes |

### Clarifications

| User-requested var | AltoRich equivalent |
|--------------------|---------------------|
| `NEXT_PUBLIC_APP_URL` | **`NEXT_PUBLIC_SITE_URL`** (canonical name in this project) |
| `ADMIN_SECRET` | **Not used** — admin via Supabase Auth + `admin_roles` |
| `JWT_SECRET` / `SESSION_SECRET` | **Not used** — Supabase Auth manages sessions |

### Optional vars documented

- `RESEND_API_KEY`
- `NEXT_PUBLIC_SMARTSUPP_KEY`
- `NEXT_PUBLIC_ROI_MODE_ENABLED`
- `AUTH_SKIP_DEVICE_OTP` (dev only)

### Fixes applied

- `.env.local.example` rewritten with production requirements
- `getPublicEnv()` / `getServerEnv()` now include `NEXT_PUBLIC_ROI_MODE_ENABLED`
- `scripts/deploy/load-env.js` updated with Smartsupp + auth skip keys
- `/api/health/env` reports optional var presence

---

## 6. Build verification

| Check | Result |
|-------|--------|
| `npm run type-check` | Passed |
| `npm run build` | Passed |
| `npm run lint` | Added ESLint config — run after `npm install` |

No missing imports, no hydration changes, no schema modifications.

---

## 7. Deployment compatibility

| Platform | Status | Notes |
|----------|--------|-------|
| **Namecheap Node / cPanel** | Ready | `server.js`, `.cpanel.yml`, `build-cpanel.sh` |
| **Vercel** | Ready | `npm run build` + env vars |
| **Cloudflare** | Compatible | DNS/CDN; Pages needs Next adapter |
| **Supabase** | Ready | Migrations in `supabase/migrations/` |
| **Resend** | Optional | Graceful skip if key missing |
| **GitHub Actions** | Ready | `.github/workflows/deploy-production.yml` |

---

## 8. Performance improvements

| Area | Status |
|------|--------|
| Fonts | `display: swap` on Google fonts in root layout |
| Images | Next.js Image used in marketing components |
| Scripts | Smartsupp loaded `afterInteractive` only |
| Bundle | Tailwind moved to devDependencies (smaller prod install if `--omit=dev`) |
| Caching | Security headers in `next.config.ts`; static assets via Next |
| Shared hosting | `cpus: 1`, `workerThreads: false` for CloudLinux |

No feature or UI changes made.

---

## 9. Security review

| Check | Status |
|-------|--------|
| Secrets in git | None — `.env*` gitignored |
| Service role in client | Not exposed — server-only import path |
| Admin routes | Protected via `hasAdminRole()` + middleware |
| Health env endpoint | Reports boolean presence only |
| Security headers | HSTS, X-Frame-Options, nosniff, etc. in `next.config.ts` |
| `poweredByHeader` | Disabled |

---

## 10. Files removed

**None removed in this sprint.**

| Item | Decision |
|------|----------|
| `server.js` | **Kept** — required for cPanel |
| `deploy.sh`, `.cpanel.yml` | **Kept** — active production pipeline |
| `docs/reference/` | **Kept** — design reference assets (not in build); optional future cleanup |

No JSON storage artifacts remain to remove.

---

## 11. Remaining recommendations

1. **Run `npm install`** after pulling — tailwind packages moved to devDependencies.
2. **Set production env vars** on Vercel/cPanel matching `.env.local.example`.
3. **Apply latest Supabase migrations** including referral programme before production deploy.
4. **Run `npm run lint`** in CI alongside build.
5. **Optional:** Remove `docs/reference/` saved HTML snapshots (~legacy design refs) to reduce repo size.
6. **Optional:** Add Vercel `vercel.json` if deploying there with custom headers/regions.
7. **Payout Approved / server events:** Wire Smartsupp events from admin approval routes (see Smartsupp report).
8. **Cloudflare Pages:** If using Pages (not proxy-only), add `@cloudflare/next-on-pages` adapter.

---

## Summary

AltoRich is **production-ready** as a standard Next.js application with Supabase PostgreSQL. Use `npm run build` + `npm start` everywhere except cPanel, where `server.js` remains the Passenger entry point. All JSON persistence has been removed; environment variables are documented and validated; build and type-check pass.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step deployment instructions.
