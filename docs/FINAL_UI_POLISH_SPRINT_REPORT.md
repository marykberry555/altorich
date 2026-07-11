# Final UI/UX Polish Sprint Report

**Date:** July 10, 2026  
**Scope:** Dark theme, dashboard greeting, investment copy, Naira typography, invest flow, package cards, visual polish  
**Constraints respected:** No auth, wallet ledger, investment calculation, or database changes.

---

## 1. Dark Theme Fixes

### Root cause
The desktop sidebar uses a dark navy background (`--sidebar-bg`) but navigation and user profile text used light-surface tokens (`--heading`, `--text-muted`). In light theme, `--heading` is dark navy — effectively invisible on the sidebar.

### Fixes applied
| Area | Change |
|------|--------|
| **Sidebar nav** | Dedicated `sidebar` variant in `DashboardShell` using `--sidebar-text`, `--sidebar-muted`, `--sidebar-active`, `--sidebar-hover` |
| **User profile block** | Name and email now use sidebar tokens on desktop; surface tokens on mobile drawer |
| **Member avatar (sidebar)** | `variant="sidebar"` — light initials on `bg-white/10`, emerald-light text |
| **Mobile bottom nav** | Inactive labels: `--text-subtle` → `--text-muted` for better contrast |
| **Badges** | Navy variant uses `--heading` instead of dark `--navy`; outline uses `--border-strong` |
| **Form errors** | Red text includes `dark:text-red-400` |
| **Metric accents** | Sky/amber icon colors include dark-mode variants |
| **Dark tokens** | Brighter `--gold`, `--emerald-light`, `--navy-mid` for accents on dark surfaces |

### Files
- `src/app/globals.css`
- `src/components/dashboard/DashboardShell.tsx`
- `src/components/profile/MemberAvatar.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/Input.tsx`
- `src/components/design-system/accent.ts`

---

## 2. Greeting Improvements

**Before:** `Good afternoon, Demo Member` inline with package on second line.

**After (stacked, premium hierarchy):**
```
Good afternoon,
Demo Member          ← bold, larger (xl/2xl)
Not Selected         ← package label, medium weight
```

- Greeting on its own line with trailing comma
- Member name emphasized beneath
- Selected package (or active tier name) on third line
- Removed cluttered “· not funded” suffix

**File:** `src/components/dashboard/DashboardCyclePanel.tsx`

---

## 3. Investment Wording Updates

| Before | After |
|--------|-------|
| Fund a plan to start **accruing** | Fund a plan to start **earning** |
| Accrued this week | **Earned** this week |
| Weekly interest (empty state) | **Weekly earnings** |
| Not selected | **Not Selected** |

Investments page hero simplified — removed long explanatory paragraph about signup preference.

---

## 4. Naira Symbol Verification

### Implementation
- Exported `NAIRA_SYMBOL` (`U+20A6`) from `src/lib/domain.ts`
- `formatNaira()` now prefixes amounts with the official sign explicitly (not locale-dependent `NGN` abbreviation)
- Added `.currency-ngn` utility in `globals.css` with tabular figures
- Applied `currency-ngn` class on monetary displays in cards, charts, invest flow, and metric stats
- Form labels use `NAIRA_SYMBOL` constant (funding, payouts)
- Chart Y-axis uses `NAIRA_SYMBOL` for compact ticks

### Typography
Plus Jakarta Sans and Instrument Sans (Google Fonts, latin subset) render U+20A6 with two horizontal strokes. All UI amounts flow through `formatNaira()` for consistency.

### Future-ready
Server notification strings still use inline `₦` in a few service files — UI layer is unified; email/PDF templates can import `formatNaira` when added.

---

## 5. Investment Flow Improvements

Replaced verbose single-step modal with **`InvestFlowSheet`** — a minimal step wizard:

```
Select package (card) → Choose amount → Review → Confirm → Investment activated → Dashboard
```

### UX characteristics
- Step indicator (Amount → Review → Done)
- No projection paragraphs on amount step — wallet balance one line only
- Review screen: compact summary table (package, amount, duration, settlement, expected return)
- Success: checkmark, amount confirmation, **Return to dashboard** + auto-redirect
- Mobile: bottom sheet on small screens, centered modal on desktop
- `InvestNowModal` re-exports `InvestFlowSheet` for compatibility

**Files:**
- `src/components/investment/InvestFlowSheet.tsx` (new)
- `src/components/investment/InvestNowModal.tsx` (re-export)
- `src/components/investment/InvestmentPackageCard.tsx`

---

## 6. Components Improved (Unique Sky Way Patterns)

Patterns adapted (not copied) from USW reference:

| USW pattern | Alto Rich adaptation |
|-------------|---------------------|
| Plan selection field with clear selected state | Package pre-selected from card; step header shows package name |
| Deposit success summary rows | Review step definition list with bordered summary |
| Step-based confirmation | Amount → Review → Confirm → Success |
| Minimal plan cards on marketing | Slim fintech cards: name, min, duration, return, CTA only |
| Active investment list on same page | Preserved `ActiveInvestmentsList` below packages |
| Quick fund wallet CTA | Compact footer strip on investments page |

---

## 7. Mobile Improvements

- Invest flow: full-width bottom sheet, touch-friendly buttons
- Package cards: single column → 2-col → 4-col responsive grid
- Sidebar replaced by drawer with correct surface tokens (readable in both themes)
- Bottom nav contrast improved
- Dashboard greeting scales typography (`text-xl` → `text-2xl` on sm+)

---

## 8. UI/UX Improvements

- **Package cards:** Removed description, risk box, status badges, max investment, settlement row clutter — only essentials remain
- **Investments page:** Cleaner header, removed preferred-package banner card (featured ring on card instead)
- **Card hover:** Subtle lift animation on package cards
- **Spacing & hierarchy:** Consistent uppercase eyebrow labels, tighter section rhythm
- **Expected return:** Centralized `formatExpectedReturnSummary()` in investment catalog

---

## 9. Remaining Recommendations

1. **Browser QA:** Manually verify dark theme on `/wallet`, `/portfolio`, `/deposits`, `/withdrawals` in Chrome/Safari mobile — automated build passes but visual QA on real devices is advised.
2. **Service-layer Naira:** Align `notification.service.ts`, `deposit.service.ts`, `withdrawal.service.ts` to use `formatNaira()` when email templates ship.
3. **Social proof toasts:** Hardcoded `₦` strings in `SocialProofToasts.tsx` — migrate to `formatNaira` for consistency.
4. **Admin sidebar:** Uses surface tokens on raised background (correct); no change needed unless admin gets a dark nav variant.
5. **Conditional crypto/KYC UI:** Wire admin feature flags to show/hide panels when re-enabled post-launch.
6. **Invest deep link:** Optional `?package=growth` query to scroll/highlight preferred package on `/investments`.

---

## Build Status

`npm run build` — **passes** (Next.js 16.2.6, 88 routes)

---

## Summary

Alto Rich now has readable sidebar identity in both themes, a premium dashboard greeting, cleaner earning-focused language, consistent Naira rendering, and a fast minimal invest wizard that guides members from package selection to dashboard confirmation without unnecessary copy.
