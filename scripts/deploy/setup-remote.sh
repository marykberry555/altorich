#!/bin/bash
# Run locally after SSH key auth is configured.
set -euo pipefail

REMOTE_URL="ssh://altosujd@162.254.39.13:21098/home/altosujd/repositories/alto-app"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "Initializing git repository..."
  git init -b main
fi

if git remote get-url production >/dev/null 2>&1; then
  git remote set-url production "$REMOTE_URL"
  echo "Updated remote 'production' -> $REMOTE_URL"
else
  git remote add production "$REMOTE_URL"
  echo "Added remote 'production' -> $REMOTE_URL"
fi

echo ""
echo "Next steps:"
echo "  1. ssh altosujd@162.254.39.13 -p 21098"
echo "  2. Create Git repo + Node.js app in cPanel (see scripts/deploy/cpanel-checklist.sh)"
echo "  3. git add -A && git commit -m \"Initial production deploy setup\""
echo "  4. git push production main"
