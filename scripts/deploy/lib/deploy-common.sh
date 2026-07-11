#!/bin/bash
# Shared helpers for AltoRich cPanel / Passenger deployments.
# shellcheck shell=bash

: "${APP_ROOT:=/home/altosujd/repositories/alto-app}"
: "${LOG_DIR:=/home/altosujd/logs}"
: "${NODE_USER:=altosujd}"
: "${NODE_APP_ROOT:=repositories/alto-app}"
: "${NODE_VERSION:=22}"
: "${HEALTH_PATH:=/api/health}"
: "${HEALTH_HOST:=127.0.0.1}"
: "${HEALTH_PORT:=3000}"
: "${DEPLOY_PUBLIC_URL:=https://altorich.com}"
: "${RESTART_WAIT_SECS:=5}"
: "${HEALTH_WAIT_SECS:=90}"
: "${HEALTH_POLL_SECS:=3}"

deploy_log() {
  local message="[deploy $(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"
  echo "$message"
  mkdir -p "$LOG_DIR"
  echo "$message" >>"$LOG_DIR/deploy.log"
}

lsnode_pids() {
  pgrep -f "lsnode:${APP_ROOT}/" 2>/dev/null || true
}

purge_build_artifacts() {
  deploy_log "Purging previous build artifacts (never merge builds)..."
  rm -rf "${APP_ROOT}/.next"
  rm -rf "${APP_ROOT}/public/_next"
  rm -rf "${APP_ROOT}/node_modules/.cache"
  mkdir -p "${APP_ROOT}/.next"
}

verify_local_build() {
  deploy_log "Verifying local build integrity before restart..."
  APP_ROOT="$APP_ROOT" node "${APP_ROOT}/scripts/deploy/verify-local-build.mjs"
  bash "${APP_ROOT}/scripts/deploy/inject-sw-build-id.sh"
}

clear_app_caches() {
  deploy_log "Clearing runtime application caches..."
  rm -rf "${APP_ROOT}/.next/cache"
  mkdir -p "${APP_ROOT}/tmp"
  date -u +%Y-%m-%dT%H:%M:%SZ >"${APP_ROOT}/tmp/restart.txt"
  deploy_log "Cleared .next/cache and updated tmp/restart.txt"
  touch "${APP_ROOT}/server.js" 2>/dev/null || true
}

cloudlinux_selector() {
  cloudlinux-selector "$@" --json --interpreter nodejs --user "$NODE_USER" --app-root "$NODE_APP_ROOT" 2>/dev/null
}

restart_node_app() {
  local old_pids new_pids pid
  old_pids="$(lsnode_pids | tr '\n' ' ' | xargs echo || true)"
  deploy_log "Restarting Node app (Passenger). Current lsnode PIDs: ${old_pids:-none}"

  clear_app_caches

  cloudlinux_selector stop || true
  sleep 2

  local remaining
  remaining="$(lsnode_pids | tr '\n' ' ' | xargs echo || true)"
  if [[ -n "$remaining" ]]; then
    deploy_log "Stop did not exit lsnode; killing: $remaining"
    while read -r pid; do
      [[ -n "$pid" ]] || continue
      kill "$pid" 2>/dev/null || true
    done <<<"$(lsnode_pids)"
    sleep 3
  fi

  remaining="$(lsnode_pids | tr '\n' ' ' | xargs echo || true)"
  if [[ -n "$remaining" ]]; then
    deploy_log "Force-killing stubborn lsnode PIDs: $remaining"
    while read -r pid; do
      [[ -n "$pid" ]] || continue
      kill -9 "$pid" 2>/dev/null || true
    done <<<"$(lsnode_pids)"
    sleep 2
  fi

  cloudlinux_selector start || cloudlinux_selector restart || true

  local waited=0
  deploy_log "Waiting for Node app (PID or health probe)..."
  while (( waited < HEALTH_WAIT_SECS )); do
    new_pids="$(lsnode_pids | tr '\n' ' ' | xargs echo || true)"
    if [[ -n "$new_pids" && "$new_pids" != "$old_pids" ]]; then
      deploy_log "New lsnode process running: $new_pids"
      break
    fi
    if [[ -z "$old_pids" && -n "$new_pids" ]]; then
      deploy_log "lsnode process started: $new_pids"
      break
    fi
    # Passenger may lazy-start on first request after kill.
    if probe_app_health; then
      new_pids="$(lsnode_pids | tr '\n' ' ' | xargs echo || true)"
      deploy_log "Health probe succeeded${new_pids:+ (lsnode: $new_pids)}"
      break
    fi
    sleep "$HEALTH_POLL_SECS"
    waited=$((waited + HEALTH_POLL_SECS))
  done

  new_pids="$(lsnode_pids | tr '\n' ' ' | xargs echo || true)"
  if [[ -z "$new_pids" ]] && ! probe_app_health; then
    deploy_log "ERROR: Node app did not respond after restart"
    return 1
  fi

  if [[ -n "$old_pids" && -n "$new_pids" && "$old_pids" == "$new_pids" ]]; then
    deploy_log "WARNING: lsnode PID unchanged ($new_pids) but app may still be healthy"
  fi

  deploy_log "Node restart complete. lsnode PIDs: ${new_pids:-lazy/on-demand}"
}

app_health_url() {
  echo "http://${HEALTH_HOST}:${HEALTH_PORT}${HEALTH_PATH}"
}

public_health_url() {
  echo "${DEPLOY_PUBLIC_URL%/}${HEALTH_PATH}"
}

probe_app_health() {
  local url
  for url in "$(app_health_url)" "$(public_health_url)"; do
    curl -fsS --max-time 8 "$url" >/dev/null 2>&1 && {
      deploy_log "Health probe OK: $url"
      return 0
    }
  done
  return 1
}

wait_for_local_health() {
  local waited=0
  deploy_log "Waiting for app health (local or ${DEPLOY_PUBLIC_URL}, timeout ${HEALTH_WAIT_SECS}s)..."

  while (( waited < HEALTH_WAIT_SECS )); do
    if probe_app_health; then
      deploy_log "App health check passed"
      return 0
    fi
    sleep "$HEALTH_POLL_SECS"
    waited=$((waited + HEALTH_POLL_SECS))
  done

  deploy_log "ERROR: App health check timed out"
  return 1
}

verify_build_artifacts() {
  local build_id chunk_file chunk_url
  build_id="$(cat "${APP_ROOT}/.next/BUILD_ID" 2>/dev/null || true)"
  if [[ -z "$build_id" ]]; then
    deploy_log "ERROR: Missing .next/BUILD_ID — run npm run build first"
    return 1
  fi

  chunk_file="$(find "${APP_ROOT}/.next/static/chunks/app/auth/login" -name 'page-*.js' 2>/dev/null | head -1 || true)"
  if [[ -z "$chunk_file" ]]; then
    deploy_log "WARNING: Login page chunk not found in static build output"
    return 0
  fi

  chunk_url="/_next/static/chunks/app/auth/login/$(basename "$chunk_file")"
  deploy_log "Build ID: $build_id | Login chunk: $chunk_url"

  for base in "http://${HEALTH_HOST}:${HEALTH_PORT}" "${DEPLOY_PUBLIC_URL%/}"; do
    if curl -fsS --max-time 12 "${base}${chunk_url}" >/dev/null 2>&1; then
      deploy_log "Login chunk served successfully from $base"
      return 0
    fi
  done

  deploy_log "ERROR: Running app did not serve login chunk $chunk_url"
  return 1
}
