# AltoRich — Dashboard Architecture Evolution Report

**Date:** 8 July 2026  
**Reference:** Unique Sky Way (`/Users/stanlex/Documents/uniqueskyway/platform`)  
**Approach:** Reuse and refactor architectural patterns — not copy branding, content, or duplicate implementations

---

## 1. Components Reused / Refactored

Patterns studied from Unique Sky Way and adapted into AltoRich-native components:

| USW Pattern | AltoRich Implementation |
|-------------|-------------------------|
| `dashboard-shell.tsx` | `src/components/dashboard/DashboardShell.tsx` |
| `dashboard-nav-items.ts` | `src/lib/dashboard/nav.ts` |
| `dashboard-welcome-hero.tsx` | `src/components/dashboard/DashboardWelcomeHero.tsx` |
| `dashboard-skeleton.tsx` | `src/components/dashboard/DashboardSkeleton.tsx` |
| `ledger-table.tsx` | `src/components/dashboard/LedgerTable.tsx` |
| `dashboard-charts.tsx` | `src/components/dashboard/DashboardCharts.tsx` |
| `design-system/stat-card.tsx` | `src/components/design-system/MetricStatCard.tsx` |
| `design-system/dashboard-panel-card.tsx` | `src/components/design-system/DashboardPanelCard.tsx` |
| `design-system/data-table.tsx` | `src/components/design-system/DataTable.tsx` |
| `design-system/table-pagination.tsx` | `src/components/design-system/TablePagination.tsx` |
| `design-system/status-badge.tsx` | `src/components/design-system/StatusBadge.tsx` |
| `ui/table.tsx` | `src/components/design-system/Table.tsx` |
| `admin-sidebar.tsx` | `src/components/admin/AdminShell.tsx` (sectioned nav + layout) |

**Intentionally not ported (yet):** Radix Sheet/Dialog, Sonner toasts, shadcn full UI kit, admin sub-routes (`/hard/auth/*`), migration dashboard, impersonation banner — AltoRich scope differs and these add dependency weight without immediate payoff.

---

## 2. Components Redesigned

All ported components were visually upgraded for AltoRich:

- **AltoRich CSS tokens** (`--emerald`, `--heading`, `--surface-raised`, dark theme) instead of USW `primary`/`muted` shadcn tokens
- **BrandLogo** integration in dashboard/admin shells (not USW text branding)
- **Premium accent bars** on stat cards and panel cards (emerald/gold/navy palette)
- **Mobile navigation:** slide-over panel + bottom tab bar (USW pattern) with AltoRich styling
- **Welcome hero** with cooperative announcement support and member identity block
- **Charts** use AltoRich emerald/gold colors; tooltips format NGN via `formatNaira`
- **Admin** separated from member shell — dedicated `AdminShell` with operations-centre hierarchy

---

## 3. New Shared Architecture

```
src/
├── components/
│   ├── design-system/          # Shared dashboard/admin UI primitives
│   │   ├── accent.ts
│   │   ├── MetricStatCard.tsx
│   │   ├── DashboardPanelCard.tsx
│   │   ├── DataTable.tsx
│   │   ├── Table.tsx
│   │   ├── TablePagination.tsx
│   │   ├── StatusBadge.tsx
│   │   └── index.ts
│   ├── dashboard/              # Member portal shell + widgets
│   │   ├── DashboardShell.tsx
│   │   ├── DashboardWelcomeHero.tsx
│   │   ├── LedgerTable.tsx
│   │   ├── DashboardCharts.tsx
│   │   └── DashboardSkeleton.tsx
│   └── admin/
│       └── AdminShell.tsx
├── lib/dashboard/
│   ├── nav.ts                  # Centralized nav config
│   └── chart-data.ts           # Chart series builders from ledger data
└── lib/utils/avatar.ts         # Initials + greeting helpers
```

**Layout wiring:**
- `src/app/(app)/layout.tsx` — async server layout loads profile → `DashboardShell`
- `src/app/admin/layout.tsx` — RBAC gate → `AdminShell`
- `src/components/layout/DashboardLayout.tsx` — deprecated re-export for compatibility

---

## 4. Dashboard Improvements

| Area | Before | After |
|------|--------|-------|
| Shell | Fixed sidebar, basic mobile bottom nav | Sticky header, sheet menu, profile block, page titles |
| Overview | 4 stat cards + raw HTML table | Sectioned metrics (12 stat cards), welcome hero, charts |
| Charts | None | Balance history, earnings trend, allocation (Recharts) |
| Ledger | Inline `<table>` | Reusable `LedgerTable` with row detail modal |
| Loading | None | `DashboardSkeleton` + Suspense |
| Wallet | List layout | Shared `LedgerTable`, section headers |
| Portfolio | Basic cards | `MetricStatCard` grid + `StatusBadge` |

---

## 5. Admin Improvements

| Area | Before | After |
|------|--------|-------|
| Layout | Reused member `DashboardLayout` | Dedicated `AdminShell` with sectioned sidebar |
| Navigation | None | Overview / Operations / System sections with anchor links |
| Metrics | Basic `StatCard` | `MetricStatCard` with accent system |
| Tables | Raw HTML | `DataTable` + `Table` + `StatusBadge` |
| Structure | Single long page | ID-anchored sections (deposits, withdrawals, plans, investments, settings) |
| Visual identity | Marketing `PageHero` | Operations-centre header with company metadata |

---

## 6. Code Duplication Eliminated

| Duplication | Resolution |
|-------------|------------|
| Inline dashboard tables (dashboard, wallet) | Single `LedgerTable` component |
| Repeated stat card markup | `MetricStatCard` |
| Repeated panel headers + “view all” links | `DashboardPanelCard` |
| Raw `<table>` styling in admin | `DataTable` + `Table` primitives |
| Status display via generic `Badge` | Semantic `StatusBadge` with status color map |
| Nav item arrays in layout file | `src/lib/dashboard/nav.ts` |
| Old `DashboardLayout` implementation | Re-export only; logic lives in `DashboardShell` |

---

## 7. Performance Improvements

- **Suspense + skeleton** on dashboard overview — faster perceived load
- **Chart data** built server-side from existing wallet transactions (no new API)
- **Recharts** added (`recharts@^3.9.2`) — client-only chart islands
- **Mobile sheet** uses lightweight CSS overlay (no Radix Sheet bundle)
- **Nav config** tree-shakeable static module

Build: **64 routes**, type-check and production build pass.

---

## 8. Remaining Opportunities

1. **Admin sub-routes** — Split `/admin` monolith into `/admin/deposits`, `/admin/members`, etc. (USW uses `/hard/auth/*`)
2. **Search & filters** — Port `ledger-filters.tsx` pattern for wallet/activities pages
3. **Pagination** — Wire `TablePagination` on full ledger/withdrawals lists
4. **Notifications panel** — Dedicated `NotificationsPanel` widget on dashboard (USW pattern)
5. **Error boundaries** — `DashboardErrorBoundary` + `ServiceErrorState` for graceful Supabase failures
6. **Export** — CSV export on admin tables
7. **Audit log viewer** — USW audit center as reference for `/admin/audit`
8. **Portfolio detail** — Investment detail sheet (USW `admin-investment-detail.tsx` pattern)
9. **Deposits/withdrawals forms** — USW multi-step forms (`form-step-indicator.tsx`) for member flows
10. **Connect Supabase** — Live data requires `.env.local` (unchanged blocker)

---

## Summary

AltoRich now inherits the **structural maturity** of Unique Sky Way — sectioned dashboards, reusable design-system primitives, chart widgets, semantic tables, and dedicated admin shell — while maintaining its **own AltoRich identity**, theme system, and cooperative business model. No USW branding, copy, or duplicate code was copied; patterns were studied, refactored, and elevated for a premium Nigerian fintech experience.
