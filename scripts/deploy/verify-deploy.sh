#!/bin/bash
# Smoke-test a deployment (local + public URLs).
# Usage: bash scripts/deploy/verify-deploy.sh [public_base_url]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/deploy-common.sh
source "$SCRIPT_DIR/lib/deploy-common.sh"

PUBLIC_BASE="${1:-${DEPLOY_PUBLIC_URL:-https://altorich.com}}"
LOCAL_HEALTH="$(app_health_url)"
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

check_route() {
  local base="$1"
  local label="$2"
  local path="$3"
  local status

  status="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 -H 'Cache-Control: no-cache' "${base%/}${path}")"
  if [[ "$status" != "200" ]]; then
    deploy_log "FAIL: $label ${path} returned HTTP $status"
    return 1
  fi

  deploy_log "PASS: $label ${path} (HTTP 200)"
  return 0
}

check_document_cache_headers() {
  local base="$1"
  local label="$2"
  local headers

  deploy_log "Checking $label document cache headers: $base/"
  headers="$(curl -sSI --max-time 20 -H 'Cache-Control: no-cache' "${base%/}/" 2>&1)" || {
    deploy_log "FAIL: $label homepage headers unreachable"
    return 1
  }

  if grep -qi 's-maxage=31536000' <<<"$headers"; then
    deploy_log "FAIL: $label homepage still allows long-lived CDN cache (s-maxage=31536000)"
    return 1
  fi

  if ! grep -qi 'cdn-cache-control: no-store' <<<"$headers" && ! grep -qi 'cache-control:.*no-store' <<<"$headers"; then
    deploy_log "WARNING: $label homepage missing explicit no-store cache directive"
  fi

  deploy_log "PASS: $label homepage cache headers look safe"
  return 0
}

check_build_id() {
  local base="$1"
  local label="$2"
  local local_id remote_id body

  local_id="$(cat "${APP_ROOT}/.next/BUILD_ID" 2>/dev/null || true)"
  if [[ -z "$local_id" ]]; then
    deploy_log "WARNING: Local BUILD_ID missing during verify"
    return 0
  fi

  body="$(curl -fsS --max-time 15 -H 'Cache-Control: no-cache' "${base%/}/api/build-id" 2>&1)" || {
    deploy_log "FAIL: $label /api/build-id unreachable"
    return 1
  }

  remote_id="$(grep -o '"buildId"[[:space:]]*:[[:space:]]*"[^"]*"' <<<"$body" | head -1 | sed 's/.*"\([^"]*\)"$/\1/')"
  if [[ "$remote_id" != "$local_id" ]]; then
    deploy_log "FAIL: $label BUILD_ID mismatch (local=$local_id remote=$remote_id)"
    return 1
  fi

  deploy_log "PASS: $label BUILD_ID $local_id"
  return 0
}

check_homepage_chunks() {
  local base="$1"
  local label="$2"
  local html chunk status

  deploy_log "Checking $label homepage chunk integrity: $base/"
  html="$(curl -fsS --max-time 20 -H 'Cache-Control: no-cache' "${base%/}/" 2>&1)" || {
    deploy_log "FAIL: $label homepage unreachable"
    return 1
  }

  while read -r chunk; do
    [[ -n "$chunk" ]] || continue
    status="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "${base%/}/_next/static/chunks/${chunk}")"
    if [[ "$status" != "200" ]]; then
      deploy_log "FAIL: $label homepage chunk ${chunk} returned HTTP $status"
      return 1
    fi
  done < <(grep -oE '/_next/static/chunks/[^"'\'' ]+\.js' <<<"$html" | sed 's|^/_next/static/chunks/||' | sort -u | head -12)

  deploy_log "PASS: $label homepage chunk references resolve"
  return 0
}

deploy_log "=== verify-deploy start ==="
wait_for_local_health
verify_build_artifacts
check_url "app health" "$PUBLIC_HEALTH"
check_build_id "$PUBLIC_BASE" "public"
check_document_cache_headers "$PUBLIC_BASE" "public"
check_homepage_chunks "$PUBLIC_BASE" "public"
check_login_chunk "$PUBLIC_BASE" "public"
check_route "$PUBLIC_BASE" "public" "/download"
check_route "$PUBLIC_BASE" "public" "/"
deploy_log "=== verify-deploy complete ==="
