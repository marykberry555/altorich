#!/usr/bin/env bash
# Unified deploy: Supabase migrations → GitHub → cPanel production Git
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

BRANCH="${DEPLOY_BRANCH:-main}"
SUPABASE_PROJECT_REF="${SUPABASE_PROJECT_REF:-zqnuvqfzdzoxkdmcijpp}"
PRODUCTION_REMOTE="${PRODUCTION_REMOTE:-production}"
PRODUCTION_URL="${PRODUCTION_URL:-ssh://altosujd@162.254.39.13:21098/home/altosujd/repositories/alto-app}"
ORIGIN_URL="${ORIGIN_URL:-https://github.com/marykberry555/altorich.git}"
COMMIT_MSG="${COMMIT_MSG:-}"

log() {
  echo ""
  echo "==> $*"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

phase_supabase() {
  log "Phase 1: Supabase database migrations"
  require_cmd supabase

  if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
    echo "SUPABASE_ACCESS_TOKEN is not set. Export it before running deploy.sh." >&2
    echo '  export SUPABASE_ACCESS_TOKEN="your-token"' >&2
    exit 1
  fi

  export SUPABASE_ACCESS_TOKEN

  if [[ ! -f supabase/.temp/project-ref ]]; then
    supabase link --project-ref "$SUPABASE_PROJECT_REF"
  fi

  supabase db push --linked --yes
  log "Supabase migrations applied."
}

phase_github() {
  log "Phase 2: GitHub synchronization"
  require_cmd git

  if ! git rev-parse --git-dir >/dev/null 2>&1; then
    git init -b "$BRANCH"
  fi

  if git remote get-url origin >/dev/null 2>&1; then
    git remote set-url origin "$ORIGIN_URL"
  else
    git remote add origin "$ORIGIN_URL"
  fi

  git add -A

  if git diff --cached --quiet; then
    log "No staged changes to commit."
  else
    local message="${COMMIT_MSG:-chore(deploy): release AltoRich platform update}"
    git commit -m "$message"
    log "Committed: $message"
  fi

  git push -u origin "$BRANCH"
  log "Pushed to origin/$BRANCH."
}

phase_cpanel() {
  log "Phase 3: cPanel production Git deployment"
  require_cmd git

  if git remote get-url "$PRODUCTION_REMOTE" >/dev/null 2>&1; then
    git remote set-url "$PRODUCTION_REMOTE" "$PRODUCTION_URL"
  else
    git remote add "$PRODUCTION_REMOTE" "$PRODUCTION_URL"
  fi

  git push "$PRODUCTION_REMOTE" "$BRANCH"
  log "Pushed to $PRODUCTION_REMOTE/$BRANCH (cPanel post-deploy runs via .cpanel.yml)."
}

main() {
  case "${1:-all}" in
    supabase) phase_supabase ;;
    github) phase_github ;;
    cpanel) phase_cpanel ;;
    all)
      phase_supabase
      phase_github
      phase_cpanel
      log "Deploy pipeline complete."
      ;;
    *)
      echo "Usage: $0 [all|supabase|github|cpanel]" >&2
      exit 1
      ;;
  esac
}

main "$@"
