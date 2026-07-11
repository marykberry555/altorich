# AltoRich PWA & Android Release Report

**Sprint:** Production PWA & Android App Release  
**Version:** 1.0.0  
**Date:** July 2026  
**Domain:** https://altorich.com

---

## 1. PWA completion

| Item | Status | Notes |
|------|--------|-------|
| Web App Manifest | Done | `public/site.webmanifest` — start URL `/app`, shortcuts, screenshots |
| Service Worker | Done | `public/sw.js` — static/runtime caching, offline fallback |
| Offline page | Done | `/offline` |
| Install prompt | Done | Smart banner with Install / Maybe later / Never |
| Update detection | Done | Toast when new SW version available |
| Standalone display | Done | `display: standalone`, safe-area CSS |
| App shortcuts | Done | Dashboard, Wallet, Deposit, Invest |
| Theme / status bar | Done | `#064e3b`, apple-mobile-web-app meta tags |
| Maskable icons | Done | Generated via `npm run brand:optimize` |
| Apple touch icons | Done | Existing + metadata in root layout |

**PWA start behaviour:** Installed app opens `/app` → redirects to `/auth/login` or `/dashboard` (admin → `/hard`).

---

## 2. TWA generation

| Item | Status |
|------|--------|
| TWA manifest | Done — `android/twa-manifest.json` |
| Build script | Done — `scripts/android/build-twa.sh` |
| Package ID | `com.altorich.app` |
| Digital Asset Links template | Done — `public/.well-known/assetlinks.json` |
| Documentation | Done — `android/README.md` |

**Action required:** Replace placeholder SHA256 fingerprints in `assetlinks.json` after generating the signing key.

---

## 3. APK generation

Run locally after Android SDK + signing key setup:

```bash
npm run android:build
```

Output: `android/output/altorich-release.apk`

---

## 4. AAB generation

Same build command produces `android/output/altorich-release.aab` for Play Console upload.

---

## 5. Download page

**URL:** `/download` — benefits, platform options, install guides, release notes, FAQ, TWA build reference. Added to sitemap.

---

## 6. Download button placement

| Location | Component |
|----------|-----------|
| Homepage header | `SiteHeader` |
| Homepage hero | `HomePage` |
| Footer | Company links |
| Member dashboard sidebar | Get the app |

---

## 7. Native-like feature support

| Feature | Status |
|---------|--------|
| Offline detection | Done |
| Install detection | Done |
| Camera / file upload | Permissions-Policy updated |
| Push notifications | Future-ready |
| Biometrics | Future-ready |

---

## 8. Install prompt verification

Shows after 2nd visit or 12s delay. Respects dismiss / never. Hidden in standalone mode.

---

## 9. Performance

Service worker caches static assets; no API caching. Existing Next.js optimisations unchanged.

---

## 10. Lighthouse PWA score

Run after deploy:

```bash
npx lighthouse https://altorich.com/download --only-categories=pwa --view
```

Target: 90+ PWA category.

---

## 11. Google Play readiness checklist

- [x] TWA project prepared
- [x] AAB/APK build script
- [x] Asset links file hosted
- [ ] Signing key generated
- [ ] SHA256 in asset links
- [ ] Asset links verified
- [ ] Play Console listing

---

## 12. Remaining recommendations

1. Generate signing key and update `assetlinks.json`
2. Run `npm run brand:optimize` on deploy
3. Firebase for push (future)
4. Lighthouse CI in GitHub Actions
