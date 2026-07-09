#!/bin/bash
# Post-deploy hook — invoked by .cpanel.yml after git push.
set -euo pipefail

APP_ROOT="${APP_ROOT:-/home/altosujd/repositories/alto-app}"
LOG_DIR="${LOG_DIR:-/home/altosujd/logs}"
NODE_VERSION="${NODE_VERSION:-22}"

mkdir -p "$LOG_DIR"
mkdir -p "$APP_ROOT/tmp"

log() {
  echo "[deploy $(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "$LOG_DIR/deploy.log"
}

log "Starting post-deploy (Node ${NODE_VERSION})..."
export APP_ROOT NODE_VERSION LOG_DIR
/bin/bash "$APP_ROOT/scripts/deploy/build-cpanel.sh" 2>&1 | tee -a "$LOG_DIR/deploy.log"
log "Deployment complete."
