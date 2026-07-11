# Dashboard UX Refinement Sprint Report

**Sprint focus:** Member Dashboard — premium private banking experience  
**Date:** July 2026  
**Constraints respected:** No changes to authentication, wallet logic, investment logic, or database.

---

## 1. Duplicate sections removed

| Removed | Reason |
|---------|--------|
| `LivePortfolioPanel` on dashboard | Duplicated portfolio value, wallet, today's earnings, and total earnings already shown elsewhere |
| "At a glance" + "Cash flow" metric grids | Merged into a single 6-metric primary grid under the wealth hero |
| `ActiveInvestmentsList` on dashboard | Full investment cards repeated portfolio data; consolidated into **My Portfolio** |
| Bottom "Quick actions" button row | Replaced with premium action cards in a dedicated section |
| `EarningsTrendChart` in Performance | Moved into the unified portfolio section to avoid two earnings views |
| "Recent earnings" panel | Removed from dashboard; earnings story lives in portfolio + activity |
| "Recent payouts" panel | Removed; pending payout count remains in key metrics; history available on `/withdrawals` |
| Repeated chart empty copy | Removed "Charts update as you use your account." everywhere |

---

## 2. Dashboard hierarchy improvements

The dashboard now follows this order:

1. **Wealth hero** — greeting, member name, package, portfolio value, wallet balance, today's earnings  
2. **Key metrics** — wallet, portfolio value, total invested, today's earnings, total earnings, pending payouts  
3. **Quick actions** — Fund Wallet, Invest Now, Portfolio, Request Payout, Invite Friends  
4. **My Portfolio** — single consolidated portfolio block  
5. **Performance** — balance activity + asset allocation charts  
6. **Recent activity** — ledger snippet  
7. **Upcoming settlements** — next maturities  
8. **Referral progress** — VIP strip with progress bar  
9. **Latest notifications** — unread-aware preview  

Section spacing increased (`space-y-10`), card count reduced, and section labels use restrained uppercase tracking for a calmer hierarchy.

---

## 3. Portfolio redesign

New component: `DashboardPortfolioSection`

- **One section only** titled "My Portfolio"
- Shows: portfolio value (live), active investments, average daily return, total earnings, next settlement countdown
- Includes accrual progress bar for the current settlement period
- Embeds the performance area chart (settlement earnings trend)
- Single CTA: **Open portfolio**
- Elegant empty state shown **once** when no investments exist, with **Invest Now** action

---

## 4. Empty state improvements

| Context | Copy |
|---------|------|
| No investments | "No active investments yet." + journey guidance + Invest Now |
| Charts (all) | Illustration + "No activity to display yet." |
| Recent activity | "No transactions yet." |
| Upcoming settlements | "No upcoming settlements." |
| Notifications | "You're all caught up." |

No repeated "Fund your wallet / Browse packages" blocks on the dashboard.

---

## 5. Visual refinements

- **Wealth hero:** Navy-to-emerald gradient, glass-style stat tiles, larger portfolio typography (4xl–5xl)
- **Quick actions:** Gradient icon tiles, hover lift, subtle background wash
- **Metric cards:** Reused elevated `MetricStatCard` with accent bars and hover elevation
- **Portfolio card:** Top gradient rule, structured stat grid, live progress bar
- **Referral strip:** Compact progress bar with violet-to-emerald gradient
- **Skeleton:** Updated to match new layout (hero, 6 metrics, 5 actions, portfolio, charts)

---

## 6. Copy refinements

| Before | After |
|--------|-------|
| Live portfolio | Portfolio value |
| Investment Overview / Active investments | My Portfolio |
| View full portfolio | Open portfolio |
| Browse packages | Invest Now (dashboard empty state) |
| Charts update as you use your account | No activity to display yet |
| At a glance / Cash flow | (removed — implicit in layout) |
| Ledger | Account activity |
| Upcoming maturities | Upcoming settlements / Next maturities |
| Quick actions (button row) | Premium action cards with descriptions |

---

## 7. Mobile improvements

- Hero stacks greeting and portfolio value vertically on small screens
- Key metrics: 2-column grid on `sm`, 3-column on `xl`
- Quick actions: 2-column on `sm`, 5-column on `lg`
- Portfolio stats: 2-column → 4-column responsive grid
- Touch-friendly action cards with full-width tap targets
- Reduced horizontal clutter by removing duplicate panels

---

## 8. Performance improvements

- Removed redundant client panels (`LivePortfolioPanel` + duplicate lists) from the dashboard tree
- Single live accrual aggregation path in hero + portfolio (shared `aggregateLiveAccrual`)
- Performance section reduced from 4 panels to 2 charts
- Skeleton aligned to fewer above-the-fold blocks for faster perceived load
- `AnimatedEarningsCounter` now eases value transitions (420ms cubic ease-out)

---

## 9. Remaining recommendations

1. **Animated live tick** — Consider re-enabling sub-second live accrual updates in `AnimatedEarningsCounter` for active investors (currently animates on value change only).
2. **Portfolio page parity** — Apply the same consolidation and copy rules to `/portfolio` (still has legacy section titles).
3. **Notifications mark-read** — Add inline "mark as read" on dashboard notification previews.
4. **ROI mode hero** — When `NEXT_PUBLIC_ROI_MODE_ENABLED` is on, `DashboardCyclePanel` serves as hero; metrics grid follows without duplicating the gradient hero.
5. **Dark mode chart axes** — Recharts axis colors could use CSS variables more consistently in dark theme.
6. **Referral empty fallback** — Dashboard referral strip gracefully degrades if referral migration is not applied; consider a softer "Invite friends" CTA when programme data is unavailable.

---

## Files changed / added

**New**
- `src/components/dashboard/ChartEmptyPlaceholder.tsx`
- `src/components/dashboard/DashboardQuickActions.tsx`
- `src/components/dashboard/DashboardWealthHero.tsx`
- `src/components/dashboard/DashboardPortfolioSection.tsx`
- `src/components/dashboard/DashboardReferralStrip.tsx`
- `src/components/dashboard/DashboardNotificationsPreview.tsx`

**Updated**
- `src/app/(app)/dashboard/page.tsx`
- `src/components/dashboard/DashboardCharts.tsx`
- `src/components/dashboard/DashboardSkeleton.tsx`
- `src/components/design-system/DataTable.tsx` (optional section titles)
- `src/components/investment/AnimatedEarningsCounter.tsx`

**Build:** `npm run build` — passed

---

The dashboard now opens on wealth-first information—how much you have, what's invested, what you earned today, and what to do next—without admin-style repetition or template clutter.
