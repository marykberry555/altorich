#!/bin/bash
# Post-deploy hook — invoked by .cpanel.yml after git push.
set -euo pipefail

APP_ROOT="${APP_ROOT:-/home/altosujd/repositories/alto-app}"
LOG_DIR="${LOG_DIR:-/home/altosujd/logs}"
NODE_VERSION="${NODE_VERSION:-22}"

export APP_ROOT NODE_VERSION LOG_DIR

mkdir -p "$LOG_DIR" "$APP_ROOT/tmp"

/bin/bash "$APP_ROOT/scripts/deploy/build-cpanel.sh"
