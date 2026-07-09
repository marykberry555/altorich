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
npm install --include=dev

echo "Copying node_modules for build (CloudLinux symlink workaround)..."
rm -f node_modules
cp -a "/home/altosujd/nodevenv/repositories/alto-app/${NODE_VERSION}/lib/node_modules" ./node_modules

echo "Building..."
npx next build

echo "Removing local node_modules copy..."
rm -rf node_modules

mkdir -p tmp
touch tmp/restart.txt

echo "Done. In cPanel: Run NPM Install (restores symlink), then RESTART the app."
