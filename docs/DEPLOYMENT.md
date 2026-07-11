# AltoRich — Production Deployment Guide

This document describes how to build, configure, and deploy AltoRich on supported hosting platforms.

AltoRich is a **standard Next.js 16 App Router** application backed by **Supabase PostgreSQL**. There is no custom JSON database or file-based persistence in the application runtime.

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | **20.x LTS** or **22.x LTS** (see `.nvmrc`) |
| npm | **≥ 10** |
| Database | Supabase (PostgreSQL) |

```bash
nvm use          # reads .nvmrc (22)
npm install
```

---

## Environment Variables

Copy the template and fill in values:

```bash
cp .env.local.example .env.local
```

### Required for production

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SITE_URL` | Public | Canonical site URL (emails, auth redirects, SEO) |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon key (RLS-protected client) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Service role key — never expose to browser |

> **Note:** AltoRich uses `NEXT_PUBLIC_SITE_URL`, not `NEXT_PUBLIC_APP_URL`.  
> Auth is handled by **Supabase Auth** — no custom `JWT_SECRET`, `SESSION_SECRET`, or `ADMIN_SECRET` is required.

### Optional

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Email delivery via Resend |
| `NEXT_PUBLIC_SMARTSUPP_KEY` | Live chat widget |
| `NEXT_PUBLIC_ROI_MODE_ENABLED` | Enable weekly ROI mode (`true`/`false`) |
| `AUTH_SKIP_DEVICE_OTP` | Local dev only — skip device OTP |

Validate locally:

```bash
npm run verify:db
npm run verify:rls
```

On cPanel server:

```bash
node scripts/deploy/verify-production-env.mjs
```

Health endpoints (presence only, never secret values):

- `GET /api/health` — liveness
- `GET /api/health/ready` — readiness + feature flags
- `GET /api/health/env` — env var presence check

---

## Build Process

```bash
npm run type-check   # TypeScript
npm run lint         # Type-check + ESLint
npm run build        # Production build (webpack — required on CloudLinux/cPanel)
npm start            # Standard Next.js production server
```

The build output lives in `.next/`. Do not commit `.next/` or `node_modules/`.

Startup validation runs via `src/instrumentation.ts` — missing required Supabase vars throw in production.

---

## Production Startup

### Standard (Vercel, Docker, most Node hosts)

```bash
npm run build
npm start
```

Uses the official Next.js production server (`next start`). Default port: **3000** (`PORT` env supported).

### Namecheap / cPanel (Phusion Passenger)

cPanel Node.js Selector requires a custom entry point:

```bash
npm run build
npm run start:cpanel   # runs server.js
```

Configure **Application startup file** to: `server.js`

`server.js` loads environment from `.env.production` via `scripts/deploy/load-env.js`, then starts a custom HTTP server wrapping Next.js. This is **only required for cPanel/Passenger** — not for Vercel or `next start`.

Automated cPanel deploy flow:

1. Git push → `.cpanel.yml` triggers `scripts/deploy/post-deploy.sh`
2. `build-cpanel.sh` installs deps, runs `npm run build`, restarts Node app
3. GitHub Actions (`.github/workflows/deploy-production.yml`) can push to cPanel remote

---

## Database Migration (Supabase)

All persistence uses PostgreSQL through Supabase. Apply migrations before first deploy:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

See also: [docs/SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

Verify after migration:

```bash
npm run verify:db
npm run verify:rls
npm run seed:auth    # optional demo accounts
```

---

## Platform-Specific Notes

### Vercel

1. Import repository
2. Set environment variables in Project Settings
3. Framework preset: **Next.js**
4. Build command: `npm run build`
5. Output: default (Next.js)
6. Node.js version: **22.x**

No `server.js` needed.

### Cloudflare

- **Pages + Next.js**: use Cloudflare's Next.js adapter if deploying to Pages
- **DNS / CDN**: point domain to origin; no app changes required
- Ensure Supabase URLs are reachable from Cloudflare edge

### Namecheap Node.js Hosting (cPanel)

- Node version: **22** (see `scripts/deploy/build-cpanel.sh`)
- Startup file: `server.js`
- Env file: `.env.production` on server (or cPanel UI env vars)
- Build uses `--webpack` flag (CloudLinux compatibility)
- `next.config.ts` sets `experimental.cpus: 1` for shared hosting

### GitHub Actions

Workflow: `.github/workflows/deploy-production.yml`

Requires secret: `CPANEL_DEPLOY_KEY`

Unified local deploy script:

```bash
export SUPABASE_ACCESS_TOKEN=...
./deploy.sh          # supabase + github + cpanel
./deploy.sh cpanel   # cpanel only
```

---

## Security Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` set only on server — never `NEXT_PUBLIC_*`
- [ ] `.env.local`, `.env.production` in `.gitignore`
- [ ] Admin routes protected via Supabase session + `admin_roles` RLS
- [ ] Service role client only in server modules (`src/lib/supabase/server.ts`)
- [ ] `/api/health/env` reports presence only, never values

---

## Troubleshooting

### Build fails on cPanel (EAGAIN / worker errors)

`next.config.ts` already limits workers (`cpus: 1`, `workerThreads: false`). Ensure Node 22 virtualenv is active:

```bash
bash scripts/deploy/build-cpanel.sh
```

### Missing env vars in production

```bash
node scripts/deploy/verify-production-env.mjs
curl https://your-domain.com/api/health/env
```

### Supabase not connected (yellow banner in dev)

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, restart server.

### Auth / session issues

Confirm `NEXT_PUBLIC_SITE_URL` matches your production domain (including `https://`).

### Smartsupp not loading

Set `NEXT_PUBLIC_SMARTSUPP_KEY`. Missing key fails gracefully — site continues to work.

---

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm start` | Next.js production server |
| `npm run start:cpanel` | cPanel/Passenger entry |
| `npm run type-check` | TypeScript validation |
| `npm run lint` | Type-check + ESLint |
| `npm run verify:db` | Supabase schema check |
| `npm run verify:rls` | RLS policy check |
| `npm run deploy:health` | Remote health probe |

---

## Related Documentation

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) — database setup
- [SMARTSUPP_INTEGRATION_REPORT.md](./SMARTSUPP_INTEGRATION_REPORT.md) — live chat
- [DEPLOYMENT_AUDIT_REPORT.md](./DEPLOYMENT_AUDIT_REPORT.md) — latest production audit
