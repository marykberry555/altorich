# AltoRich — UI/UX Refinement & Polish Report (Surgical Fix Sprint)

**Date:** 9 July 2026  
**Scope:** UI/UX only (no DB, APIs, auth, wallet, or investment logic changes)  
**Dev server:** restarted cleanly on `http://localhost:3000`

---

## 1. Homepage sections removed

Removed the dedicated **“Value props / Why AltoRich”** section to reduce homepage density and repetition. Trust messaging now lives in:
- a tighter hero (single trust line), and
- the “Security & governance” section (verification-first narrative + metrics).

---

## 2. Hero improvements

Updated `src/components/marketing/HomePage.tsx` and `src/content/site.ts`:
- Reduced hero content to **headline + one short paragraph + two CTAs**
- Removed secondary “portfolio growth” overlay card (visual noise)
- Simplified trust line to a single crisp statement (company registration)
- Refined copy to more professional fintech language (less marketing fluff)

---

## 3. Testimonial improvements

Implemented a premium marquee-style testimonial strip:
- **Continuous auto-slide** with a single smooth animation (no dots/counters/controls)
- **Infinite loop** via duplicated track
- **Pause on hover** (desktop)
- **Swipe/drag support** (mobile + desktop pointer drag temporarily pauses animation)
- No pagination UI and no “1 of N”

Key files:
- `src/components/marketing/TestimonialsMarquee.tsx`
- `src/app/globals.css` (marquee + scrollbar hiding)

---

## 4. Dark theme issues fixed

Completed a contrast sweep for theme-breaking usages of `text-[var(--navy)]` on dark surfaces. Replaced with theme-safe tokens:
- `text-[var(--heading)]` for headings and key labels
- `text-[var(--text)] / text-[var(--text-muted)]` for body and secondary copy

High-impact fixes included:
- Marketing pages: About, Mission, Leadership, Partner, Plans, Contact, Learn pages
- App pages: Profile, Deposits, Settings, Withdrawals, Notifications, Team, VIP, Activities
- Design-system accent: navy icon color now respects theme heading token

---

## 5. Copy refinements

Adjusted several copy points to be shorter and more “financial platform” aligned:
- Hero eyebrow/title/subtitle refined
- CTA heading simplified (“Ready to get started?”)
- Blog titles reduced in repeated geographic emphasis

---

## 6. Layout improvements

Homepage rhythm improved:
- Reduced vertical density (fewer sections)
- More breathing room in hero (shorter copy, fewer elements)
- Product section now leads with “What you can invest in” (clear intent)

---

## 7. Accessibility improvements

- Improved contrast by removing hard-coded navy text in dark mode contexts
- Reduced motion support: marquee disables animation under `prefers-reduced-motion`
- Better readability: trimmed paragraph density in hero and CTA

---

## 8. Responsive fixes

Testimonials:
- Uses `overflow-x-auto` + hidden scrollbar for touch devices
- Pointer drag support improves usability on tablet/mobile
- Card width caps with `min(420px, 84vw)` to prevent overflow

---

## 9. Remaining UI recommendations

Suggested next polish pass (still no new features):
- Replace remaining content-wide “Nigeria” references in **Learn articles** where non-legal (leave legal pages intact).
- Run a visual pass in-browser for:
  - chart tooltip contrast in dark mode
  - dropdown menus (focus/hover contrast)
  - table zebra contrast in dark mode
- Consider adding a subtle **section divider rhythm** (thin borders) on homepage for even cleaner Stripe-style separation.

