#!/bin/bash
# Post-deploy hook — invoked by .cpanel.yml after git push.
set -euo pipefail

APP_ROOT="${APP_ROOT:-/home/altosujd/alto-app}"
LOG_DIR="${LOG_DIR:-/home/altosujd/logs}"
NODE_ENV=production
export NODE_ENV

mkdir -p "$LOG_DIR"
mkdir -p "$APP_ROOT/tmp"

log() {
  echo "[deploy $(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "$LOG_DIR/deploy.log"
}

# Activate cPanel Node.js virtualenv when present (path varies by app name / Node version).
for venv in /home/altosujd/nodevenv/alto-app/*/bin/activate; do
  if [ -f "$venv" ]; then
    # shellcheck disable=SC1090
    source "$venv"
    log "Activated virtualenv: $venv"
    break
  fi
done

cd "$APP_ROOT"

log "Node: $(command -v node) ($(node -v))"
log "Installing dependencies..."
npm ci 2>&1 | tee -a "$LOG_DIR/deploy.log"

log "Building Next.js app..."
npm run build 2>&1 | tee -a "$LOG_DIR/deploy.log"

log "Restarting Passenger / Node app..."
touch "$APP_ROOT/tmp/restart.txt"

log "Deployment complete."
