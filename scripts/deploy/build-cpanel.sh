#!/bin/bash
# Build AltoRich on CloudLinux/cPanel (Node.js Selector with symlinked node_modules).
# Usage: bash scripts/deploy/build-cpanel.sh
set -euo pipefail

APP_ROOT="${APP_ROOT:-/home/altosujd/repositories/alto-app}"
NODE_VERSION="${NODE_VERSION:-22}"
VENV="/home/altosujd/nodevenv/repositories/alto-app/${NODE_VERSION}/bin/activate"

# shellcheck disable=SC1090
source "$VENV"
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

mkdir -p tmp
date -u +%Y-%m-%dT%H:%M:%SZ > tmp/restart.txt

echo "Restarting Passenger app..."
if cloudlinux-selector restart --json --interpreter nodejs --user altosujd --app-root repositories/alto-app 2>/dev/null; then
  echo "Passenger restart requested via cloudlinux-selector."
else
  echo "cloudlinux-selector restart unavailable — touch tmp/restart.txt and restart in cPanel if needed."
fi

echo "Done."
