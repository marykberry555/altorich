# Dashboard Priority & Live Earnings Sprint Report

**Scope:** UI/UX and data presentation only — no changes to investment engine, wallet math, settlement logic, or PostgreSQL.

---

## 1. Dashboard hierarchy improvements

The hero section now follows investor priority:

1. **Greeting** — name, status, package
2. **Live accrued earnings** — primary focal metric
3. **Next payout countdown** — Monday 9:00 AM WAT
4. **Wallet balance**
5. **Portfolio value** (demoted from headline)
6. **Total invested**
7. **Today's earnings**

Removed the duplicate four-card metric row below the hero. Portfolio value no longer dominates the top-right of the hero.

The dashboard hero always renders (live or static fallback). ROI cycle panel moved **below** the hero so earnings appear first.

## 2. Live earnings implementation

- Reuses `aggregateLiveAccrual()` + `AnimatedEarningsCounter` with `liveRate` extrapolation.
- Displays **2-decimal** live tick (₦1.00 → ₦1.01 → …) synced to `accrualPerSecond` from the existing accrual engine.
- **Today's growth** sub-line with live tick and "Accruing live" trend badge.
- Subtle `pulse-soft` animation on the earnings card when actively accruing.
- No fake values — rAF counter re-anchors every second via `useLiveNow`.

## 3. Payout countdown restoration

- New `DashboardPayoutCountdown` embedded directly under live earnings.
- Shows **Monday · 9:00 AM WAT** with days/hours/mins/secs digit animation.
- Updates every second via `useLiveNow` + `nextPayoutProcessingAt()`.
- Empty state: **Not scheduled** when user has no active investments.

## 4. Mobile refinements

- Compact padding (`p-5`) and tighter greeting row for small screens.
- Live earnings + countdown + wallet visible without scrolling on typical mobile viewports.
- Secondary metrics in 2×2 grid on mobile, 4-column on desktop.
- Empty state **Invest Now** CTA inline in hero.

## 5. Performance validation

- Single `useLiveNow` tick per hero; aggregate memoized on `liveInputs` + `now`.
- Live numbers use one rAF loop per `AnimatedEarningsCounter` (not per-digit timers).
- Countdown shares the same 1s tick — no duplicate intervals.
- Build passes with no new server or DB dependencies.

## 6. Remaining recommendations

1. **Unify ROI + plan hero** — When both ROI mode and plan investments are active, consider merging cycle panel metrics into the main hero.
2. **Portfolio section** — De-emphasize duplicate portfolio value headline in `DashboardPortfolioSection` now that hero leads with earnings.
3. **Sparkline** — Add a tiny earnings trend sparkline inside the live earnings card (historical data already available in analytics).
4. **Haptic / reduced motion** — Respect `prefers-reduced-motion` for pulse and countdown pop animations.

---

## Key files

| File | Change |
|------|--------|
| `src/components/dashboard/DashboardWealthHero.tsx` | Earnings-first hero layout |
| `src/components/dashboard/DashboardPayoutCountdown.tsx` | Embedded payout countdown |
| `src/app/(app)/dashboard/page.tsx` | Hero always shown; ROI panel reordered |

## QA checklist

- [x] Desktop / tablet / mobile layout
- [x] Light + dark theme (CSS variables)
- [x] Active investments — live tick
- [x] No investments — ₦0.00 + Not scheduled + Invest Now
- [x] Payout countdown accuracy (Monday 9am WAT)
- [x] Build passes
- [ ] Manual cross-browser visual QA
