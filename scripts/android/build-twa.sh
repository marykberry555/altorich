#!/usr/bin/env bash
# Build AltoRich Trusted Web Activity (APK + AAB) using Bubblewrap.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ANDROID_DIR="$ROOT/android"
MANIFEST="$ANDROID_DIR/twa-manifest.json"
OUTPUT="$ANDROID_DIR/output"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

echo "==> AltoRich TWA build"
require_cmd npx
require_cmd java

mkdir -p "$OUTPUT"

if [[ ! -f "$ANDROID_DIR/signing-key.jks" ]]; then
  echo "WARNING: android/signing-key.jks not found."
  echo "Generate one with:"
  echo "  keytool -genkeypair -v -keystore android/signing-key.jks -alias altorich -keyalg RSA -keysize 2048 -validity 10000"
  echo "Then update SHA256 fingerprints in public/.well-known/assetlinks.json"
fi

cd "$ANDROID_DIR"

if [[ ! -d "app" ]]; then
  echo "==> Initializing Bubblewrap project (first run)"
  npx --yes @bubblewrap/cli@latest init --manifest="$MANIFEST" --directory=. --yes
fi

echo "==> Building release APK"
npx --yes @bubblewrap/cli@latest build --skipPwaValidation

APK_SRC="$(find . -name '*release*.apk' -print -quit)"
AAB_SRC="$(find . -name '*release*.aab' -print -quit)"

if [[ -n "${APK_SRC:-}" ]]; then
  cp "$APK_SRC" "$OUTPUT/altorich-release.apk"
  echo "APK: $OUTPUT/altorich-release.apk"
fi

if [[ -n "${AAB_SRC:-}" ]]; then
  cp "$AAB_SRC" "$OUTPUT/altorich-release.aab"
  echo "AAB: $OUTPUT/altorich-release.aab"
fi

echo "==> TWA build complete"
echo "Verify Digital Asset Links before Play Store upload:"
echo "  https://altorich.com/.well-known/assetlinks.json"
