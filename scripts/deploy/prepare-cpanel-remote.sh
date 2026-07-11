#!/bin/bash
# Reset cPanel Git working tree so `git push production main` is accepted.
# cPanel rejects pushes when the deployment directory has unstaged changes.
#
# Usage (local):
#   bash scripts/deploy/prepare-cpanel-remote.sh
#
# Or set PREPARE_CPANEL_REMOTE=0 to skip from deploy.sh
set -euo pipefail

REMOTE_HOST="${CPANEL_SSH_HOST:-altosujd@162.254.39.13}"
REMOTE_PORT="${CPANEL_SSH_PORT:-21098}"
APP_ROOT="${CPANEL_APP_ROOT:-/home/altosujd/repositories/alto-app}"

echo "==> Preparing cPanel remote for git push ($REMOTE_HOST:$APP_ROOT)"

ssh -p "$REMOTE_PORT" -o StrictHostKeyChecking=accept-new "$REMOTE_HOST" bash -s <<EOF
set -euo pipefail
cd "$APP_ROOT"

if [[ ! -d .git ]]; then
  echo "ERROR: $APP_ROOT is not a git repository"
  exit 1
fi

echo "Before cleanup:"
git status --short | head -20 || true

# Discard tracked edits from prior builds / manual server tweaks
git reset --hard HEAD

# Remove untracked build/runtime artifacts (keep .env.production if present)
git clean -fd --exclude=.env.production --exclude=.env.local 2>/dev/null || git clean -fd

echo "After cleanup:"
git status --short | head -20 || true

if [[ -n "\$(git status --porcelain)" ]]; then
  echo "WARNING: working tree still not clean — push may fail"
  git status
  exit 1
fi

echo "Remote working tree is clean."
EOF

echo "==> cPanel remote ready for push"
