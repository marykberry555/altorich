#!/bin/bash
# Force Phusion Passenger to reload the Node.js app after deploy.
set -euo pipefail

APP_ROOT="${APP_ROOT:-/home/altosujd/repositories/alto-app}"
mkdir -p "$APP_ROOT/tmp"
date -u +%Y-%m-%dT%H:%M:%SZ > "$APP_ROOT/tmp/restart.txt"
echo "Wrote $APP_ROOT/tmp/restart.txt — Passenger should reload within ~30s."
