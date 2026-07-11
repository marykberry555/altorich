#!/bin/bash
# Build AltoRich on CloudLinux/cPanel (Node.js Selector with symlinked node_modules).
# Usage: bash scripts/deploy/build-cpanel.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/deploy-common.sh
source "$SCRIPT_DIR/lib/deploy-common.sh"

APP_ROOT="${APP_ROOT:-/home/altosujd/repositories/alto-app}"
NODE_VERSION="${NODE_VERSION:-22}"
VENV="/home/altosujd/nodevenv/repositories/alto-app/${NODE_VERSION}/bin/activate"

# shellcheck disable=SC1090
set +u
source "$VENV"
set -u
cd "$APP_ROOT"

export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=768}"

deploy_log "=== build-cpanel start (Node ${NODE_VERSION}) ==="

deploy_log "Installing dependencies into virtualenv..."
rm -rf node_modules 2>/dev/null || true
npm install --include=dev

deploy_log "Copying node_modules for build (CloudLinux symlink workaround)..."
# rm -f leaves a partial directory after a failed deploy and breaks cp -a ("File exists").
rm -rf node_modules
cp -a "/home/altosujd/nodevenv/repositories/alto-app/${NODE_VERSION}/lib/node_modules" ./node_modules

  deploy_log "Building (webpack — required on CloudLinux)..."
  npm run gate:production
  npm run build

deploy_log "Removing local node_modules copy..."
rm -rf node_modules

deploy_log "Restoring CloudLinux node_modules symlink..."
npm install --include=dev

deploy_log "Build finished. BUILD_ID=$(cat .next/BUILD_ID 2>/dev/null || echo missing)"

bash "$SCRIPT_DIR/refresh-node-app.sh"
bash "$SCRIPT_DIR/verify-deploy.sh"

# Keep cPanel Git working tree clean so the next `git push production` is accepted.
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  deploy_log "Resetting git working tree after build..."
  git reset --hard HEAD
  git clean -fd --exclude=.env.production --exclude=.env.local 2>/dev/null || git clean -fd
fi

deploy_log "=== build-cpanel complete ==="
