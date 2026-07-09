#!/bin/bash
# Force Phusion Passenger to reload the Node.js app after deploy.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$SCRIPT_DIR/refresh-node-app.sh"
