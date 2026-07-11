# AltoRich Android Trusted Web Activity

This folder contains the **Trusted Web Activity (TWA)** configuration for wrapping [https://altorich.com](https://altorich.com) as a native Android app.

## Prerequisites

- Node.js 20+
- Java JDK 17+
- Android SDK (via Android Studio or command-line tools)
- `keytool` for signing key generation

## Quick start

```bash
# 1. Generate signing key (once)
keytool -genkeypair -v \
  -keystore android/signing-key.jks \
  -alias altorich \
  -keyalg RSA -keysize 2048 -validity 10000

# 2. Get SHA256 fingerprint for Digital Asset Links
keytool -list -v -keystore android/signing-key.jks -alias altorich | grep SHA256

# 3. Update public/.well-known/assetlinks.json with the fingerprint(s)

# 4. Deploy asset links to production, then verify:
#    https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://altorich.com&relation=delegate_permission/common.handle_all_urls

# 5. Build APK + AAB
npm run android:build
```

Outputs are copied to `android/output/`:

- `altorich-release.apk` — sideload / QA testing
- `altorich-release.aab` — Google Play Store upload

## Configuration

| Setting | Value |
|---------|-------|
| Package ID | `com.altorich.app` |
| Host | `altorich.com` |
| Start URL | `/app` (login → dashboard) |
| Display | Standalone, portrait |
| Manifest | `twa-manifest.json` |

## Digital Asset Links

Production must serve `/.well-known/assetlinks.json` with the release (and debug, for testing) signing certificate SHA256 fingerprints.

## Google Play checklist

- [ ] Signing key generated and backed up securely
- [ ] Asset links verified on production domain
- [ ] AAB built and tested on physical device
- [ ] Privacy policy URL: `/legal/privacy`
- [ ] Store listing assets (screenshots from `/images/pwa/`)
- [ ] Content rating questionnaire
- [ ] Target API level meets Play requirements

## Notes

- The TWA loads the live website — no duplicate business logic in Android code.
- Push notifications require Firebase setup (future-ready; manifest flag enabled).
- Do **not** commit `signing-key.jks` — it is gitignored.
