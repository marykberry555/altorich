#!/bin/bash
# Clear caches and force-restart the Passenger Node app (no rebuild).
# Usage: bash scripts/deploy/refresh-node-app.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/deploy-common.sh
source "$SCRIPT_DIR/lib/deploy-common.sh"

deploy_log "=== refresh-node-app start ==="
restart_node_app
wait_for_local_health
verify_build_artifacts || true
deploy_log "=== refresh-node-app complete ==="
