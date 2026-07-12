#!/usr/bin/env bash
# Copy built admin APK/AAB into public/downloads for direct sideload.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SRC="$ROOT/android/output/admin"
DEST="$ROOT/public/downloads"

mkdir -p "$DEST"

if [[ -f "$SRC/altorich-admin-release.apk" ]]; then
  cp "$SRC/altorich-admin-release.apk" "$DEST/altorich-admin-release.apk"
  echo "Published: public/downloads/altorich-admin-release.apk"
else
  echo "No admin APK found at $SRC/altorich-admin-release.apk — run npm run android:admin:build first." >&2
  exit 1
fi

if [[ -f "$SRC/altorich-admin-release.aab" ]]; then
  cp "$SRC/altorich-admin-release.aab" "$DEST/altorich-admin-release.aab"
  echo "Published: public/downloads/altorich-admin-release.aab"
fi
