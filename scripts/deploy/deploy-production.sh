#!/bin/bash
# Ordered production deploy — build, verify assets, THEN restart Passenger.
# Usage: DEPLOY_ENABLED=1 bash scripts/deploy/deploy-production.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/deploy-common.sh
source "$SCRIPT_DIR/lib/deploy-common.sh"

APP_ROOT="${APP_ROOT:-/home/altosujd/repositories/alto-app}"
export APP_ROOT

if [[ -f "${APP_ROOT}/DEPLOY_LOCK" && "${DEPLOY_ENABLED:-0}" != "1" ]]; then
  deploy_log "ERROR: Deploy blocked by DEPLOY_LOCK. Export DEPLOY_ENABLED=1 to override."
  exit 1
fi

deploy_log "=== deploy-production start (ordered) ==="

# 1–4: Clean, build, verify local artifacts (no Passenger restart yet)
bash "$SCRIPT_DIR/build-cpanel.sh" --no-restart

# 5: Restart Passenger only after all static assets verified on disk
bash "$SCRIPT_DIR/refresh-node-app.sh"

# 6–7: Health + public verification
bash "$SCRIPT_DIR/verify-deploy.sh"

deploy_log "=== deploy-production complete ==="
