#!/bin/bash
# Purge Cloudflare cache for HTML/SW only (optional — requires CF env vars).
# Usage: bash scripts/deploy/purge-cloudflare-cache.sh
set -euo pipefail

ZONE_ID="${CLOUDFLARE_ZONE_ID:-}"
API_TOKEN="${CLOUDFLARE_API_TOKEN:-}"
SITE="${DEPLOY_PUBLIC_URL:-https://altorich.com}"

if [[ -z "$ZONE_ID" || -z "$API_TOKEN" ]]; then
  echo "SKIP: Set CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN to purge edge cache."
  exit 0
fi

HOST="$(python3 - <<'PY'
from urllib.parse import urlparse
import os
print(urlparse(os.environ["SITE"]).netloc)
PY
)"

echo "Purging Cloudflare cache for ${HOST} (HTML + SW only)..."

curl -fsS -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data "{\"hosts\":[\"${HOST}\"],\"tags\":[\"html\",\"sw\"]}" \
  | grep -q '"success":true'

echo "Cloudflare purge request accepted."
