# Alto Rich Product Standards

This document captures design, copy, and engineering conventions established during the institutional product audit (July 2026). Use it when adding pages, components, or member-facing copy.

## Design language

Tokens live in `src/app/globals.css`:

| Token | Usage |
|-------|--------|
| `--radius`, `--radius-sm`, `--radius-lg` | Cards, buttons, inputs |
| `--section-py`, `--section-py-hero-*` | Marketing section padding |
| `--motion-fast/base/slow`, `--ease-out` | Transitions |
| `--tap-min` (44px) | Minimum touch targets |
| `--shadow-xs` → `--shadow-lg` | Elevation |

Prefer existing primitives:

- **Buttons:** `src/components/ui/Button.tsx`
- **Cards:** `src/components/ui/Card.tsx`
- **Empty states:** `src/components/ui/EmptyState.tsx` + optional icon
- **Status chips:** `src/components/design-system/StatusBadge.tsx`
- **Confirm dialogs:** `src/components/trust/SecureConfirmDialog.tsx` (member), `AdminConfirmDialog` (admin)
- **Errors:** `src/components/errors/RouteErrorFallback.tsx`, `InlineErrorNotice.tsx`
- **Loading:** `src/components/brand/AppLoader.tsx`, `AuthPageFallback.tsx`

## Terminology

Canonical member-facing terms are defined in `src/lib/copy/terminology.ts`.

| Use | Avoid in member UI |
|-----|---------------------|
| Member | User, client, customer |
| Deposit / Deposits | Funding, top-up, wallet funding |
| Withdrawal / Withdrawals | Payout, cash out (except internal referral payout flows) |
| Notifications | Alerts (navigation label) |

Internal code may retain `payout`, `funding`, etc. for API and service names — only surface copy should use canonical terms.

## SEO

- Public pages: `buildMetadata()` from `src/lib/seo.ts` with unique `title`, `description`, and `path`.
- Legal pages: `legalPageMetadata()` from `src/lib/seo/page-metadata.ts`.
- Member portal: `memberPageMetadata()` — sets `noIndex: true`.
- Include `breadcrumbJsonLd()` on major marketing pages where breadcrumbs exist in UI.

**Note:** `buildMetadata` uses each page's `description` for meta, OpenGraph, and Twitter tags (not the global default).

## Error experience

- HTTP-aware copy: `memberCopyForHttpStatus`, `memberCopyForAppCode` in `src/lib/errors/taxonomy.ts`.
- Route boundaries use `RouteErrorFallback` with `role="alert"`.
- Empty states explain what will appear and never fabricate data.

## Accessibility

- Semantic headings (one `h1` per page).
- `EmptyState`: `role="status"`, `aria-live="polite"`.
- `Skeleton`: `motion-reduce:animate-none`, `aria-hidden`.
- Dialogs: focus trap via initial focus, Escape to close, `aria-labelledby`.
- Tables: `<caption>`, `scope` on headers where used (e.g. login history).

## Trust & security surfaces

- Member: `/security`, `/security/activity`, `/privacy`
- Public: `/company/security`, `/compliance`, `/business-continuity`
- Incident banners: `src/lib/trust/incident-framework.ts` — empty by default until configured
- System health (admin): `/admin-app/system-health` — architecture only, no fabricated metrics

## Future extension points

| Area | Location | Ready for |
|------|----------|-----------|
| Incident comms | `incident-framework.ts` | Scheduled banners, push/email |
| System health | `system-health.ts` | Live probes for DB, queue, settlement |
| Privacy center | `PrivacyCenterContent` | Full data export/deletion API |
| 2FA | `TwoFactorPlaceholder` | TOTP/WebAuthn integration |
| Compliance hub | `compliance-catalog.ts` | CMS-driven regulatory notices |

## Manual QA checklist (pre-deploy)

1. Registration → email verification → login → dashboard
2. Deposit submit → tracker → history
3. Withdrawal confirm dialog → queue view
4. Security Center login history (empty vs populated)
5. Public SEO: view-source on `/contact`, `/legal/*`, `/packages/*`
6. Mobile nav + bottom bar on 375px viewport
7. Admin security dashboard search/filter
8. Reduced motion: OS setting on — skeletons should not pulse
