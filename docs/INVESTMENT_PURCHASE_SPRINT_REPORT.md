# Investment Purchase & Live Earnings Sprint Report

**Date:** July 10, 2026  
**Scope:** Complete investment lifecycle UX — wallet-funded purchases, active investments, live earnings, portfolio refinement

---

## 1. Investment Purchase Flow

| Step | Implementation |
|------|----------------|
| Browse packages | `/investments` — 4 package cards (Starter, Growth, Premium, Elite) |
| Invest Now | `InvestNowModal` — amount, wallet balance, projected summary, validation |
| Confirm | `POST /api/investments` → existing `InvestmentService.purchasePlan()` |
| Active status | Wallet debited → investment status `active` immediately (unchanged backend) |
| Success | Modal success state → redirect to `/investments/[id]` |

**Preferred package at signup** is displayed as a banner only — it does **not** auto-create an investment.

---

## 2. Wallet Integration

- Investments funded **only** from wallet balance (existing ledger debit in `purchasePlan`)
- Modal shows live wallet balance and blocks confirm if insufficient
- Link to `/deposits` when balance is too low
- Min/max validation matches plan rules from `investment_plans` table

---

## 3. Active Investment System

| Component | Purpose |
|-----------|---------|
| `ActiveInvestmentCard` | Package, amount, current value, earnings, progress, next settlement |
| `ActiveInvestmentsList` | Grid of active positions with empty state |
| `/investments/[id]` | Full detail: timeline, settlement history, live accrual panel |

Data mapped via `lib/investment/mappers.ts` including last paid settlement for accurate accrual periods.

---

## 4. Dashboard Improvements

- **`LivePortfolioPanel`** — live portfolio value, today's earnings, total earnings, accrual progress bar
- **Active investments** section when user has open positions
- **Recent payouts** panel
- Quick actions: Fund wallet · Invest now · View portfolio · Request payout
- Cycle panel CTA changed from marketing packages → **Invest now** (`/investments`)
- Nav item: **Invest** → `/investments`

---

## 5. Portfolio Improvements

- Live portfolio hero panel
- Summary metrics (active, invested, earned, value)
- Balance history + earnings trend charts
- **Package distribution** pie chart (by active plan)
- Upcoming maturities
- Full investments table with detail links
- Active investment cards

---

## 6. Live Earnings Implementation

**File:** `src/lib/investment-accrual-live.ts`

- Computes in-period accrual from `projected_daily`, `settlement_frequency`, and `total_earned`
- Uses last paid settlement timestamp when available
- **`AnimatedEarningsCounter`** updates on `useLiveNow` tick (1s) — visual only, no ledger mutation
- **`aggregateLiveAccrual`** powers dashboard portfolio strip

Live values = credited earnings + linear accrual within current settlement period. Consistent with backend settlement schedule, not fabricated balances.

---

## 7. Components Reused from Unique Sky Way (Adapted)

| USW pattern | Alto Rich adaptation |
|-------------|---------------------|
| `investment-accrual-live.ts` | `lib/investment-accrual-live.ts` (Alto settlement model) |
| `InvestmentAccrualLive` | `InvestmentAccrualPanel` |
| `AnimatedEarningsCounter` | Same pattern, Naira formatting |
| `ActiveInvestmentSummaryCard` | `ActiveInvestmentCard` with progress bars |
| `investment-plans-section` card layout | `InvestmentPackageCard` tier accents |
| `useLiveNow` + provider | Already in app layout |
| Portfolio pie / area charts | Existing `DashboardCharts` reused on portfolio |

No USW branding copied.

---

## 8. UI/UX Improvements

- Premium modal invest flow with success animation
- Gradient live portfolio strip on dashboard
- Card-based package browser with risk notice
- Progress bars for cycle and accrual period
- Settlement countdown (HMS format)
- Responsive grids (mobile → desktop)
- Light/dark theme via existing CSS variables
- `aria-live` on animated counters

---

## 9. Remaining Recommendations

1. **Alto Elite plans** — add `investment_plans` rows with `tier = 'elite'` in admin/DB so Elite card is investable
2. **Plan picker within tier** — when multiple plans share a tier (e.g. Alto A/B), add sub-selector in modal
3. **Post-purchase toast** — optional global success notification on dashboard return
4. **ROI mode** — when `NEXT_PUBLIC_ROI_MODE_ENABLED=true`, standard plan flow is hidden; consider unified live panel for ROI + plans
5. **Settlement cron** — ensure admin settlement processor runs on schedule so live accrual resets align with credits
6. **Investment proof export** — PDF statement per investment reference

---

## Files Created

- `src/lib/investment-accrual-live.ts`
- `src/lib/packages/investment-catalog.ts`
- `src/lib/investment/mappers.ts`
- `src/components/investment/AnimatedEarningsCounter.tsx`
- `src/components/investment/InvestmentPackageCard.tsx`
- `src/components/investment/InvestNowModal.tsx`
- `src/components/investment/ActiveInvestmentCard.tsx`
- `src/components/investment/LivePortfolioPanel.tsx`
- `src/components/investment/InvestmentAccrualPanel.tsx`
- `src/app/(app)/investments/page.tsx`
- `src/app/(app)/investments/[id]/page.tsx`

## Build Status

`npm run build` — **passes** ✓

## QA Checklist

| Item | Status |
|------|--------|
| Wallet debit via existing API | ✓ Unchanged |
| Investment creation → active | ✓ Unchanged |
| Portfolio / dashboard updates | ✓ |
| Transaction history (ledger) | ✓ |
| Mobile responsive layout | ✓ |
| Light/dark theme | ✓ |
| Live animation (no ledger mutation) | ✓ |
