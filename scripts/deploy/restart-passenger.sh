#!/bin/bash
# Force Phusion Passenger to reload the Node.js app after deploy.
set -euo pipefail

APP_ROOT="${APP_ROOT:-/home/altosujd/repositories/alto-app}"
mkdir -p "$APP_ROOT/tmp"
rm -rf "$APP_ROOT/.next/cache"
date -u +%Y-%m-%dT%H:%M:%SZ > "$APP_ROOT/tmp/restart.txt"

OLD_PID="$(pgrep -f "lsnode:${APP_ROOT}/" 2>/dev/null | head -1 || true)"
cloudlinux-selector restart --json --interpreter nodejs --user altosujd --app-root repositories/alto-app 2>/dev/null || true
sleep 5
NEW_PID="$(pgrep -f "lsnode:${APP_ROOT}/" 2>/dev/null | head -1 || true)"

if [[ -n "$OLD_PID" && "$OLD_PID" == "$NEW_PID" ]]; then
  echo "Passenger still on stale PID ${OLD_PID}; killing lsnode..."
  kill "$OLD_PID" 2>/dev/null || true
  sleep 3
  cloudlinux-selector start --json --interpreter nodejs --user altosujd --app-root repositories/alto-app 2>/dev/null || true
fi

echo "Passenger restart complete."
