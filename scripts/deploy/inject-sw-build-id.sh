#!/bin/bash
# Stamp BUILD_ID into public/sw.js from template (versioned SW cache names).
set -euo pipefail

APP_ROOT="${APP_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
TEMPLATE="${APP_ROOT}/public/sw.template.js"
TARGET="${APP_ROOT}/public/sw.js"
BUILD_ID_FILE="${APP_ROOT}/.next/BUILD_ID"

if [[ ! -f "$BUILD_ID_FILE" ]]; then
  echo "inject-sw-build-id: missing .next/BUILD_ID" >&2
  exit 1
fi

BUILD_ID="$(tr -d '\n' <"$BUILD_ID_FILE")"
sed "s/__BUILD_ID__/${BUILD_ID}/g" "$TEMPLATE" >"$TARGET"
echo "inject-sw-build-id: stamped sw.js with BUILD_ID=${BUILD_ID}"
