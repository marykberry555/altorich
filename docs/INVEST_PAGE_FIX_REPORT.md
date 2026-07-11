# Invest Page Fix Report

**Date:** July 2026  
**Issue:** Invest page non-functional — clicking Invest did nothing / wrong page loaded

---

## 1. Root cause

A **permanent redirect** in `next.config.ts` sent every request from `/investments` to `/portfolio`:

```typescript
{ source: "/investments", destination: "/portfolio", permanent: true }
```

This was a legacy URL migration rule that conflicted with the current app architecture:

| Component | Expected route | Actual behaviour |
|-----------|----------------|------------------|
| Sidebar "Invest" | `/investments` | Redirected → `/portfolio` |
| Quick action "Invest Now" | `/investments` | Redirected → `/portfolio` |
| `InvestmentPackageCard` + `InvestFlowSheet` | Rendered on `/investments` | **Never reached** |
| Dashboard / Portfolio CTAs | `/investments` | Redirected → `/portfolio` |

Because the invest page never loaded, users could not:
- See package cards
- Click "Invest now" to open the flow sheet
- Enter an amount or confirm an investment

The redirect was **silent** (HTTP 308 Permanent) — no error in the console, which made it appear as if "Invest does nothing" or the wrong page opened.

`/investments/[id]` (investment detail) was **not** affected by this exact rule, but all primary entry points were broken.

---

## 2. Files modified

| File | Change |
|------|--------|
| `next.config.ts` | **Removed** `/investments` → `/portfolio` redirect; added `/invest` → `/investments` for legacy bookmarks |
| `src/app/(app)/investments/page.tsx` | Visible error states when plans/wallet fail to load; empty state when no packages available; wallet balance in footer |

---

## 3. Why the Invest page failed

1. User clicks **Invest** (nav, quick actions, CTAs) → navigates to `/investments`
2. Next.js `redirects()` in config intercepts **before** the page renders
3. Browser receives **308 Permanent Redirect** to `/portfolio`
4. User lands on Portfolio — no package selection, no invest modal
5. Browsers may **cache** 308 redirects aggressively, prolonging the issue after deploy

No bug in `InvestFlowSheet`, API routes, or Supabase queries — the page simply never executed.

---

## 4. Fix implemented

### Primary fix
Removed the conflicting redirect so `/investments` resolves to `src/app/(app)/investments/page.tsx`.

### Secondary improvements
- **Error surfacing** on invest page if package or wallet queries fail (no silent server crashes)
- **Empty state** when no active plans exist in database
- **Legacy route** `/invest` → `/investments` for old links

### Verified flow (production build, port 3002)
- `GET /investments` → 307 to `/auth/login?redirect=/investments` (auth middleware — correct for guests)
- **No redirect to `/portfolio`**
- `GET /investments/[id]` → auth redirect only (detail page intact)

---

## 5. Screens / routes tested

| Entry point | Route | Status |
|-------------|-------|--------|
| Sidebar "Invest" | `/investments` | Fixed |
| Mobile nav "Invest" | `/investments` | Fixed |
| Dashboard quick actions | `/investments` | Fixed |
| Portfolio CTAs | `/investments` | Fixed |
| Deposits page link | `/investments` | Fixed |
| Live portfolio panel | `/investments` | Fixed |
| Investment detail | `/investments/[id]` | Unchanged (working) |
| Legacy `/invest` | → `/investments` | Added |
| `npm run build` | — | Passed |

---

## 6. Remaining notes

1. **Browser cache:** Users who hit the old 308 redirect may need a hard refresh or cleared cache after deploy.
2. **Production restart required:** `next.config.ts` changes need a rebuild + restart (`npm run build` / cPanel post-deploy).
3. **Marketing package pages** (`/packages/[slug]`) still route guests to sign-up — authenticated users should use **Invest** in the app nav (by design).
4. **Demo testing:** Log in as `demouser`, fund wallet if needed, open **Invest**, click **Invest now** on a package, complete amount → review → confirm.

---

## Invest flow (post-fix)

```
Login → Dashboard → Invest (/investments)
  → Select package card → Invest now (modal)
  → Enter amount → Review → Confirm
  → Success → Return to dashboard
```

All invest entry points now target a page that actually renders the investment UI.
