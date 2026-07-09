#!/bin/bash
# Build AltoRich on CloudLinux/cPanel (Node.js Selector with symlinked node_modules).
# Usage: bash scripts/deploy/build-cpanel.sh
set -euo pipefail

APP_ROOT="${APP_ROOT:-/home/altosujd/repositories/alto-app}"
NODE_VERSION="${NODE_VERSION:-22}"
VENV="/home/altosujd/nodevenv/repositories/alto-app/${NODE_VERSION}/bin/activate"

# shellcheck disable=SC1090
set +u
source "$VENV"
set -u
cd "$APP_ROOT"

export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=768}"

echo "Installing dependencies into virtualenv..."
rm -rf node_modules 2>/dev/null || true
npm install --include=dev

echo "Copying node_modules for build (CloudLinux symlink workaround)..."
rm -f node_modules
cp -a "/home/altosujd/nodevenv/repositories/alto-app/${NODE_VERSION}/lib/node_modules" ./node_modules

echo "Building (webpack — required on CloudLinux)..."
npm run build

echo "Removing local node_modules copy..."
rm -rf node_modules

echo "Restoring CloudLinux node_modules symlink..."
npm install --include=dev

echo "Clearing Next.js route cache..."
rm -rf .next/cache

mkdir -p tmp
date -u +%Y-%m-%dT%H:%M:%SZ > tmp/restart.txt

echo "Restarting Passenger app..."
OLD_PID="$(pgrep -f "lsnode:${APP_ROOT}/" 2>/dev/null | head -1 || true)"
if cloudlinux-selector restart --json --interpreter nodejs --user altosujd --app-root repositories/alto-app 2>/dev/null; then
  echo "Passenger restart requested via cloudlinux-selector."
else
  echo "cloudlinux-selector restart unavailable — will force-kill lsnode if needed."
fi

sleep 5
NEW_PID="$(pgrep -f "lsnode:${APP_ROOT}/" 2>/dev/null | head -1 || true)"
if [[ -n "$OLD_PID" && "$OLD_PID" == "$NEW_PID" ]]; then
  echo "Passenger still running stale PID ${OLD_PID}; killing lsnode to force respawn..."
  kill "$OLD_PID" 2>/dev/null || true
  sleep 3
  if ! pgrep -f "lsnode:${APP_ROOT}/" >/dev/null 2>&1; then
    cloudlinux-selector start --json --interpreter nodejs --user altosujd --app-root repositories/alto-app 2>/dev/null || true
  fi
fi

echo "Done."
