# AltoRich — Naija UX Refinement & USW Evolution Sprint Report

**Date:** July 2026  
**Scope:** Registration package selection, dashboard overhaul, premium countdown, Nigerian UX, Unique Sky Way pattern adoption.

---

## 1. Registration improvements

- **Required Preferred Investment Package** on sign-up via tap-to-select `PackageSelectionField` (not a native dropdown).
- Packages: Alto Starter, Alto Growth, Alto Premium, Alto Elite.
- Validation blocks submission until a package is chosen.
- Nigerian phone placeholder (`08012345678`) and concise onboarding copy.
- Saved to `profiles.preferred_package_slug` at account creation (`auth.service.ts`, `api/auth/register/route.ts`).
- Migration: `supabase/migrations/20260710120000_preferred_package.sql`.

**Files:** `RegisterForm.tsx`, `PackageSelectionField.tsx`, `auth.service.ts`, `api/auth/register/route.ts`.

---

## 2. Package selection implementation

| Layer | Implementation |
|-------|----------------|
| Database | `preferred_package_slug` with CHECK enum (`starter`, `growth`, `premium`, `elite`) |
| Registration | Required field → profile on create |
| Dashboard | `DashboardWelcomeHero` — **Preferred package** vs **Active package** |
| Pending state | `PendingPackageBanner` when package selected but not funded |
| Settings | `ProfileSettingsForm` — change anytime under Profile & package |

**Distinction:** Dashboard clearly labels **“Selected at sign-up — not yet funded”** when no active investment exists.

---

## 3. Dashboard improvements

**Hierarchy (USW-inspired section stack):**

1. **Welcome hero** — greeting, avatar, package summary, CTA  
2. **Pending package banner** — fund-wallet CTA when awaiting activation  
3. **Premium payout countdown** — hero strip  
4. **At a glance** — wallet, total investments, active count, pending withdrawals  
5. **Investment progress** — live `EarningsTicker` (ROI mode)  
6. **Cash flow** — portfolio value, earned, referrals, alerts  
7. **Performance** — charts + maturities  
8. **Recent activity** — ledger + earnings  
9. **Quick actions** — fund, invest, withdraw, change package, alerts  

**Data:** `DashboardService` now includes `pendingWithdrawals` count.

---

## 4. Countdown redesign

**`PremiumPayoutCountdown`** replaces plain D/H/M blocks:

- Emerald gradient glass card with soft glow orbs  
- `AnimatedCountdownDigit` cells with `countdown-pop` keyframe  
- Cycle progress bar (week completion %)  
- Monday 09:00 WAT messaging  
- Compact pill variant in dashboard header (`variant="compact"`)  
- `LiveNowProvider` — single 1s tick for all live UI (USW pattern)

**Files:** `PremiumPayoutCountdown.tsx`, `AnimatedCountdownDigit.tsx`, `use-live-now.ts`, `globals.css`.

---

## 5. Nigerian UX improvements

- Hero: naira, WAT payouts, Monday settlements, Nigerian bank transfers.  
- How-it-works: KYC, bank fund, package activation, weekly settlements.  
- Testimonials: Abuja civil servant, Computer Village trader, diaspora Kano.  
- Trust indicators: Lagos operations hub.  
- Dashboard copy: “naira-native, WAT-aligned, fully auditable.”  
- Social proof toasts hidden on member routes (no overlap with dashboard).

---

## 6. Components reused from Unique Sky Way

| USW reference | Alto Rich implementation |
|---------------|-------------------------|
| `plan-selection-field.tsx` | `PackageSelectionField.tsx` |
| `dashboard-welcome-hero.tsx` | `DashboardWelcomeHero.tsx` |
| `pending-investment-banner.tsx` | `PendingPackageBanner.tsx` |
| `live-now-provider.tsx` | `LiveNowProvider` / `use-live-now.ts` |
| `live-earnings-hero.tsx` | `EarningsTicker` + ROI section |
| `stat-card` accent bars | `MetricStatCard` |
| `dashboard-panel-card` | `DashboardPanelCard` |
| Dashboard section stack | `dashboard/page.tsx` ordering |
| Member header identity | `MemberIdentity` + `MemberAvatar` |

**Not copied:** USW branding, colours, plan IDs, legal copy, USD-centric flows.

---

## 7. UI/UX enhancements

- Removed floating member bar (overlap with toasts / mobile nav).  
- Integrated member identity into sticky header.  
- Avatar upload only on Profile page (fixes “No file chosen” leak).  
- Settings: sectioned Profile & package + notifications block.  
- Premium countdown hero + compact header pill.  
- `countdown-pop` animation in `globals.css`.

---

## 8. Mobile improvements

- Header stacks identity + compact payout on mobile.  
- Stat grids: 2-col → 4-col responsive breakpoints.  
- Package picker full-width expandable list on small screens.  
- Bottom nav padding `pb-20` (no floating overlay).  
- Pending banner stacks CTA vertically on narrow viewports.

---

## 9. Accessibility improvements

- Package fieldset with `legend`, `listbox` / `option` roles.  
- Countdown `aria-live="polite"` and descriptive `aria-label`.  
- Timer sections use semantic `<section>` labels.  
- Focus-visible outlines preserved.  
- File input fully hidden (`hidden`, `aria-hidden`, `tabIndex={-1}`).

---

## 10. Admin UX (opportunities adopted / remaining)

**Adopted in member area:** section headers, status badges, panel cards, ledger tables.

**Remaining (pre-launch):**

- USW `admin-global-search`, filter chips, bulk actions on deposits/withdrawals  
- USW `migration-dashboard` pattern for ops health  
- Deferred chart loading (`dashboard-charts-lazy` pattern)

---

## 11. Performance

- Single `LiveNowProvider` interval instead of per-component timers.  
- Dashboard charts still server-rendered; lazy split recommended next.  
- No schema-breaking changes; no new API round-trips for package display.

---

## 12. Remaining recommendations

1. **Apply migration** — `supabase db push --linked` for `preferred_package_slug`.  
2. **Deferred dashboard sections** — Suspense split for charts (USW `dashboard-deferred-sections`).  
3. **Marketing pass** — packages detail pages, learn hub micro-animations.  
4. **Admin tables** — USW filters + export on withdrawal queue.  
5. **Lighthouse** — measure after production deploy.  
6. **Deploy** — commit, push, run `./deploy.sh cpanel`.

---

## Deploy checklist

```bash
supabase db push --linked
git add -A && git commit -m "Naija UX sprint: package signup, dashboard, premium countdown"
./deploy.sh cpanel
```

---

*AltoRich identity preserved. Authentication, wallet, investments, deposits, withdrawals, and business logic unchanged.*
