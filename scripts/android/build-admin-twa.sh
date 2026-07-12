#!/usr/bin/env bash
# Build Alto Rich Admin Trusted Web Activity (APK + AAB) using Bubblewrap.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ANDROID_DIR="$ROOT/android/admin"
MANIFEST="$ANDROID_DIR/twa-manifest.json"
OUTPUT="$ROOT/android/output/admin"
KEYSTORE="$ROOT/android/signing-key.jks"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

echo "==> Alto Rich Admin TWA build"
require_cmd npx
require_cmd java

mkdir -p "$OUTPUT"

if [[ ! -f "$KEYSTORE" ]]; then
  echo "WARNING: android/signing-key.jks not found."
  echo "Generate one with:"
  echo "  keytool -genkeypair -v -keystore android/signing-key.jks -alias altorich-admin -keyalg RSA -keysize 2048 -validity 10000 -dname \"CN=Alto Rich Admin, OU=Operations, O=Alto Rich, L=Lagos, ST=Lagos, C=NG\""
  echo "Then update SHA256 fingerprints in public/.well-known/assetlinks.json for com.altorich.admin"
fi

echo "==> Generating admin launcher icons"
npm run admin-app:icons --silent

cd "$ANDROID_DIR"

if [[ ! -d "app" ]]; then
  echo "==> Initializing Bubblewrap project (first run)"
  printf 'Y\n' | npx --yes @bubblewrap/cli@latest init --manifest="$MANIFEST" --directory=. --yes
fi

echo "==> Building release APK + AAB"
npx --yes @bubblewrap/cli@latest build --skipPwaValidation

APK_SRC="$(find . -name '*release*.apk' -print -quit)"
AAB_SRC="$(find . -name '*release*.aab' -print -quit)"

if [[ -n "${APK_SRC:-}" ]]; then
  cp "$APK_SRC" "$OUTPUT/altorich-admin-release.apk"
  echo "APK: $OUTPUT/altorich-admin-release.apk"
fi

if [[ -n "${AAB_SRC:-}" ]]; then
  cp "$AAB_SRC" "$OUTPUT/altorich-admin-release.aab"
  echo "AAB: $OUTPUT/altorich-admin-release.aab"
fi

echo "==> Admin TWA build complete"
echo "Verify Digital Asset Links before sideload / Play Store upload:"
echo "  https://altorich.com/.well-known/assetlinks.json"
