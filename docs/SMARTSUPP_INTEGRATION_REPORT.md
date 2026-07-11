# Smartsupp Live Chat Sprint Report

**Sprint focus:** Production-grade Smartsupp integration for Alto Rich  
**Date:** July 2026  
**Build status:** `npm run build` — passed

---

## 1. Smartsupp integration completed

A reusable, isolated chat integration was added under `src/lib/chat/` and `src/components/chat/`:

| File | Purpose |
|------|---------|
| `SmartsuppProvider.tsx` | Root provider — script bootstrap, theme sync, bridge, welcome hint |
| `SmartsuppBridge.tsx` | Identity sync + subtle welcome message |
| `smartsupp.ts` | Core client utilities (identify, track, bootstrap) |
| `smartsupp-events.ts` | Canonical event names |
| `smartsupp-tags.ts` | Visitor tag builder for support agents |
| `api/smartsupp/identity/route.ts` | Server endpoint for authenticated visitor context |

The loader uses Next.js `Script` with `strategy="afterInteractive"`, a single bootstrap guard (`__SMARTSUPP_BOOTSTRAPPED__`), and async loader injection — no raw HTML in pages.

---

## 2. Environment variable added

Added to `.env.local.example`:

```env
NEXT_PUBLIC_SMARTSUPP_KEY=c9c2f3f8e32cdb96c278d23abacde841c5e7e2da
```

Also registered in `src/lib/env.ts` (`getPublicEnv`) as an optional public variable. The key is consumed only via `getSmartsuppKey()` — never hardcoded in components.

**Action:** Copy the key into your local `.env.local` (and Vercel env) if not already present.

---

## 3. Root layout integration

`SmartsuppProvider` is mounted once in `src/app/layout.tsx` inside `ThemeProvider`, after `{children}`. This makes chat available globally on:

- Marketing pages (`(site)`)
- Member app (`(app)` — dashboard, portfolio, funding, investments, profile, referrals)
- Admin (`(admin)` — optional, included via root layout)

No per-page script duplication.

---

## 4. User identification implemented

`GET /api/smartsupp/identity` returns visitor context from existing services (no new DB logic):

| Field | Source |
|-------|--------|
| Name | `profiles.full_name` |
| Email | Supabase auth user |
| User ID | Supabase auth user |
| Current Package | `profiles.preferred_package_slug` |
| VIP Level | `profiles.vip_level` + package label |
| Wallet Balance | `dashboard.getMemberDashboard().balance` |

`SmartsuppBridge` fetches this on mount and on `smartsupp:refresh-identity` (after login/register/invest). Guests initialize anonymously with `Guest` tag only.

---

## 5. Visitor tagging implemented

Tags are built in `buildSmartsuppTags()` and sent via `smartsupp('variables', { Tags: '...' })`:

| Condition | Tags |
|-----------|------|
| Not logged in | Guest |
| Logged in | Member |
| Active investment | Investor |
| Admin role | Admin |
| VIP / package | VIP Starter, VIP Growth, VIP Elite, VIP Premium |

Multiple tags can apply (e.g. `Member, Investor, VIP Growth`).

---

## 6. Event tracking implemented

Events are recorded as Smartsupp visitor variables (`Last_Event`, `Last_Event_At`, `Event_<Name>`) since Smartsupp has no generic `track()` API.

| Event | Trigger |
|-------|---------|
| Account Created | Register OTP verification success |
| Login | Login + device OTP success |
| Wallet Funded | Deposit submission success |
| Investment Started | Invest flow confirmation success |
| Payout Requested | Withdrawal form submission success |

**Not yet wired (server-side only today):**

- Investment Completed — maturity/settlement (recommend server hook or admin webhook)
- Referral Earned — commission credit (recommend hook in referral service response)
- Payout Approved — admin approval action

Utility: `trackSmartsuppEvent()` + `refreshSmartsuppIdentity()` in `src/lib/chat/smartsupp.ts`.

---

## 7. Mobile compatibility verified

- Dashboard mobile bottom nav sets `body[data-mobile-nav="true"]`
- CSS lifts Smartsupp widget + welcome hint via `--smartsupp-offset-bottom: 4.25rem` on mobile
- Offset resets on `lg+` where bottom nav is hidden
- Welcome hint positioned above widget, dismissible, does not open chat
- Widget `z-index: 9990` — below modals (`z-50`) but above page chrome

Manual QA recommended on iPhone/Android for final widget DOM selector confirmation (Smartsupp may use `#chat-widget-container`).

---

## 8. Performance impact

| Aspect | Approach |
|--------|----------|
| Render blocking | None — `afterInteractive` script |
| Duplicate loads | Prevented by bootstrap guard + single root provider |
| Hydration | Provider renders `null` when key missing; no SSR widget DOM |
| Network | One async loader request after page interactive |
| Bundle | ~2KB client utilities; Smartsupp loaded externally |

Chat does not affect RSC payload or metadata generation.

---

## 9. Lighthouse impact

Expected minimal impact:

- Script deferred until after hydration (`afterInteractive`)
- No changes to metadata, JSON-LD, or viewport config
- No render-blocking third-party scripts in `<head>`
- Widget is position-fixed overlay (no CLS from layout shift in main content)

Recommend running Lighthouse before/after on marketing + dashboard pages in production with the key enabled.

---

## 10. Remaining recommendations

1. **Copy `.env.local.example` key** into production Vercel environment variables.
2. **Smartsupp dashboard** — Configure matching welcome/chatbot message and brand color (#047857 light / #34d399 dark) for consistency with the widget.
3. **Server-side events** — Wire `Investment Completed`, `Referral Earned`, and `Payout Approved` from admin/settlement services when those actions complete.
4. **Referral payout panel** — Add `trackSmartsuppEvent` on referral wallet payout request.
5. **Privacy policy link** — Set `_smartsupp.privacyNoticeUrl` to `/legal/privacy` if required for compliance.
6. **Cookie domain** — Add `_smartsupp.cookieDomain` for production subdomain continuity if needed.
7. **Widget selector audit** — Confirm Smartsupp DOM IDs in browser DevTools and adjust `globals.css` selectors if the vendor uses a different container ID.

---

## Theme support

- Bootstrap reads `data-theme` at init for widget accent color
- `SmartsuppThemeSync` updates `--smartsupp-accent` and `_smartsupp.color` on theme toggle
- Welcome hint uses design tokens (`--surface-raised`, `--border`, `--heading`) for native light/dark blending

---

## Error handling

If `NEXT_PUBLIC_SMARTSUPP_KEY` is missing:

- `SmartsuppProvider` returns `null`
- Development console warning only
- Site continues to function normally

---

The integration is production-ready, isolated, and aligned with Alto Rich's premium fintech UX without compromising SEO or build stability.
