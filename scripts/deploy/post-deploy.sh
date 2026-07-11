#!/bin/bash
# Post-deploy hook — invoked by .cpanel.yml after git push (when explicitly enabled).
set -euo pipefail

APP_ROOT="${APP_ROOT:-/home/altosujd/repositories/alto-app}"
LOG_DIR="${LOG_DIR:-/home/altosujd/logs}"
NODE_VERSION="${NODE_VERSION:-22}"

export APP_ROOT NODE_VERSION LOG_DIR

if [[ -f "${APP_ROOT}/DEPLOY_LOCK" && "${DEPLOY_ENABLED:-0}" != "1" ]]; then
  echo "[deploy] BLOCKED: DEPLOY_LOCK is present. Set DEPLOY_ENABLED=1 for manual deploy."
  exit 0
fi

mkdir -p "$LOG_DIR" "$APP_ROOT/tmp"

/bin/bash "$APP_ROOT/scripts/deploy/deploy-production.sh"
