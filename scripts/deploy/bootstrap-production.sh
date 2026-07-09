#!/bin/bash
# One-time production bootstrap for cPanel — run from Terminal or Cron.
set -euo pipefail

APP_ROOT="/home/altosujd/repositories/alto-app"
LOG_DIR="/home/altosujd/logs"
export NODE_ENV=production

mkdir -p "$LOG_DIR" "$APP_ROOT/tmp"

log() {
  echo "[bootstrap $(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "$LOG_DIR/bootstrap.log"
}

for venv in /home/altosujd/nodevenv/repositories/alto-app/*/bin/activate; do
  if [ -f "$venv" ]; then
    # shellcheck disable=SC1090
    source "$venv"
    log "Activated virtualenv: $venv"
    break
  fi
done

cd "$APP_ROOT"

if [ ! -f .env.production ]; then
  log "ERROR: .env.production missing at $APP_ROOT/.env.production"
  exit 1
fi

log "Node: $(command -v node) ($(node -v))"
log "Installing dependencies (including build tools)..."
npm ci --include=dev 2>&1 | tee -a "$LOG_DIR/bootstrap.log"

log "Building Next.js app..."
npm run build 2>&1 | tee -a "$LOG_DIR/bootstrap.log"

log "Restarting Passenger / Node app..."
touch "$APP_ROOT/tmp/restart.txt"

log "Bootstrap complete."
