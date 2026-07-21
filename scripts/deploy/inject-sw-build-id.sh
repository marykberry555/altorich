#!/usr/bin/env bash
# Keep public/sw.js as the kill-switch worker (no BUILD_ID stamp).
# Older inject stamped a caching SW that caused phone/PWA chunk loops.
set -euo pipefail

APP_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TEMPLATE="${APP_ROOT}/public/sw.template.js"
TARGET="${APP_ROOT}/public/sw.js"

if [[ ! -f "$TEMPLATE" ]]; then
  echo "inject-sw-build-id: missing public/sw.template.js" >&2
  exit 1
fi

cp "$TEMPLATE" "$TARGET"
echo "inject-sw-build-id: installed member SW kill-switch (no cache)"
