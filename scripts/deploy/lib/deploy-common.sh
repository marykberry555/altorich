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

clear_app_caches() {
  deploy_log "Clearing application caches..."
  rm -rf "${APP_ROOT}/.next/cache"
  mkdir -p "${APP_ROOT}/tmp"
  date -u +%Y-%m-%dT%H:%M:%SZ >"${APP_ROOT}/tmp/restart.txt"
  deploy_log "Cleared .next/cache and updated tmp/restart.txt"
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

  local url="http://${HEALTH_HOST}:${HEALTH_PORT}${HEALTH_PATH}"
  local waited=0
  deploy_log "Waiting for Node app (PID or health at $url)..."
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
    curl -fsS --max-time 5 "$url" >/dev/null 2>&1 && {
      new_pids="$(lsnode_pids | tr '\n' ' ' | xargs echo || true)"
      deploy_log "Health probe succeeded${new_pids:+ (lsnode: $new_pids)}"
      break
    }
    sleep "$HEALTH_POLL_SECS"
    waited=$((waited + HEALTH_POLL_SECS))
  done

  new_pids="$(lsnode_pids | tr '\n' ' ' | xargs echo || true)"
  if [[ -z "$new_pids" ]] && ! curl -fsS --max-time 5 "$url" >/dev/null 2>&1; then
    deploy_log "ERROR: Node app did not respond after restart"
    return 1
  fi

  if [[ -n "$old_pids" && -n "$new_pids" && "$old_pids" == "$new_pids" ]]; then
    deploy_log "WARNING: lsnode PID unchanged ($new_pids) but app may still be healthy"
  fi

  deploy_log "Node restart complete. lsnode PIDs: ${new_pids:-lazy/on-demand}"
}

wait_for_local_health() {
  local url="http://${HEALTH_HOST}:${HEALTH_PORT}${HEALTH_PATH}"
  local waited=0
  deploy_log "Waiting for local health at $url (timeout ${HEALTH_WAIT_SECS}s)..."

  while (( waited < HEALTH_WAIT_SECS )); do
    if curl -fsS --max-time 5 "$url" >/dev/null 2>&1; then
      deploy_log "Local health check passed"
      return 0
    fi
    sleep "$HEALTH_POLL_SECS"
    waited=$((waited + HEALTH_POLL_SECS))
  done

  deploy_log "ERROR: Local health check timed out"
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

  if curl -fsS --max-time 10 "http://${HEALTH_HOST}:${HEALTH_PORT}${chunk_url}" >/dev/null 2>&1; then
    deploy_log "Login chunk served successfully from running app"
    return 0
  fi

  deploy_log "ERROR: Running app did not serve login chunk $chunk_url"
  return 1
}
