#!/bin/bash
# Build AltoRich on CloudLinux/cPanel (Node.js Selector with symlinked node_modules).
# Usage: bash scripts/deploy/build-cpanel.sh [--no-restart]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/deploy-common.sh
source "$SCRIPT_DIR/lib/deploy-common.sh"

APP_ROOT="${APP_ROOT:-/home/altosujd/repositories/alto-app}"
NODE_VERSION="${NODE_VERSION:-22}"
VENV="/home/altosujd/nodevenv/repositories/alto-app/${NODE_VERSION}/bin/activate"
VENV_MODULES="/home/altosujd/nodevenv/repositories/alto-app/${NODE_VERSION}/lib/node_modules"
SKIP_RESTART=0

for arg in "$@"; do
  if [[ "$arg" == "--no-restart" ]]; then
    SKIP_RESTART=1
  fi
done

# shellcheck disable=SC1090
set +u
source "$VENV"
set -u
cd "$APP_ROOT"

export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=768}"

deploy_log "=== build-cpanel start (Node ${NODE_VERSION}) ==="

restore_node_modules_symlink() {
  deploy_log "Restoring CloudLinux node_modules symlink..."
  rm -rf node_modules 2>/dev/null || true
  npm install --include=dev --prefer-offline
}

ensure_venv_dependencies() {
  deploy_log "Ensuring dependencies in Node virtualenv..."
  if [[ -L node_modules ]]; then
    npm install --include=dev --prefer-offline
    return
  fi

  if [[ -d node_modules ]]; then
    deploy_log "Replacing real node_modules directory with virtualenv symlink..."
    rm -rf node_modules
  fi

  npm install --include=dev --prefer-offline
}

materialize_node_modules_for_build() {
  deploy_log "Materializing node_modules copy for webpack build..."
  if [[ -L node_modules ]]; then
    rm -f node_modules
  elif [[ -d node_modules ]]; then
    rm -rf node_modules
  fi

  if [[ ! -d "$VENV_MODULES" ]]; then
    deploy_log "ERROR: Missing virtualenv node_modules at $VENV_MODULES"
    exit 1
  fi

  cp -a "$VENV_MODULES" ./node_modules
}

ensure_venv_dependencies
materialize_node_modules_for_build

purge_build_artifacts

deploy_log "Building from scratch (webpack — required on CloudLinux)..."
npm run gate:production
npm run build

verify_local_build

deploy_log "Removing build-time node_modules copy..."
rm -rf node_modules

restore_node_modules_symlink

deploy_log "Build finished. BUILD_ID=$(cat .next/BUILD_ID 2>/dev/null || echo missing)"

if [[ "$SKIP_RESTART" -eq 0 ]]; then
  bash "$SCRIPT_DIR/refresh-node-app.sh"
  bash "$SCRIPT_DIR/verify-deploy.sh"
fi

# Keep cPanel Git working tree clean so the next `git push production` is accepted.
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  deploy_log "Resetting git working tree after build..."
  git reset --hard HEAD
  git clean -fd --exclude=.env.production --exclude=.env.local --exclude=DEPLOY_LOCK 2>/dev/null || git clean -fd
fi

deploy_log "=== build-cpanel complete ==="
