#!/bin/bash
# Smoke-test a deployment (local + public URLs).
# Usage: bash scripts/deploy/verify-deploy.sh [public_base_url]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/deploy-common.sh
source "$SCRIPT_DIR/lib/deploy-common.sh"

PUBLIC_BASE="${1:-${DEPLOY_PUBLIC_URL:-https://altorich.com}}"
LOCAL_HEALTH="http://${HEALTH_HOST}:${HEALTH_PORT}${HEALTH_PATH}"
PUBLIC_HEALTH="${PUBLIC_BASE%/}${HEALTH_PATH}"

check_url() {
  local label="$1"
  local url="$2"
  local body status

  deploy_log "Checking $label: $url"
  body="$(curl -fsS --max-time 15 "$url" 2>&1)" || {
    deploy_log "FAIL: $label unreachable"
    return 1
  }

  if ! grep -q '"status"[[:space:]]*:[[:space:]]*"ok"' <<<"$body"; then
    deploy_log "FAIL: $label did not return status ok"
    deploy_log "Body: $body"
    return 1
  fi

  deploy_log "PASS: $label"
  return 0
}

check_login_chunk() {
  local base="$1"
  local label="$2"
  local html chunk status

  deploy_log "Checking $label login page chunks: $base/auth/login"
  html="$(curl -fsS --max-time 20 -H 'Cache-Control: no-cache' "${base%/}/auth/login" 2>&1)" || {
    deploy_log "FAIL: $label login page unreachable"
    return 1
  }

  chunk="$(grep -o 'app/auth/login/page-[a-f0-9]*\.js' <<<"$html" | head -1 || true)"
  if [[ -z "$chunk" ]]; then
    deploy_log "FAIL: $label login HTML missing page chunk reference"
    return 1
  fi

  status="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "${base%/}/_next/static/chunks/${chunk}")"
  if [[ "$status" != "200" ]]; then
    deploy_log "FAIL: $label chunk ${chunk} returned HTTP $status"
    return 1
  fi

  deploy_log "PASS: $label login chunk $chunk (HTTP 200)"
  return 0
}

deploy_log "=== verify-deploy start ==="
wait_for_local_health
verify_build_artifacts
check_url "local health" "$LOCAL_HEALTH"
check_login_chunk "http://${HEALTH_HOST}:${HEALTH_PORT}" "local"
check_url "public health" "$PUBLIC_HEALTH"
check_login_chunk "$PUBLIC_BASE" "public"
deploy_log "=== verify-deploy complete ==="
