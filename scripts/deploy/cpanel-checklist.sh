#!/bin/bash
# Prints cPanel setup checklist (run locally — no server access required).
cat <<'EOF'
================================================================================
Namecheap cPanel — AltoRich deployment checklist
================================================================================

STEP 1 — SSH access
-------------------
  ssh altosujd@162.254.39.13 -p 21098

  Verify:
    • Prompt shows: altosujd@hostname
    • pwd prints: /home/altosujd
    • ls repositories/  (may be empty before Git repo is created)

  If "Permission denied (publickey)":
    • cPanel → Security → SSH Access → Manage SSH Keys → Import your public key
    • Authorize the key, then retry SSH

STEP 2 — Git Version Control (cPanel UI)
----------------------------------------
  cPanel → Files → Git Version Control → Create

    Clone URL (remote for local push):
      ssh://altosujd@162.254.39.13:21098/home/altosujd/repositories/alto-app

    Repository path:
      /home/altosujd/repositories/alto-app

    Deployment:
      ☑ Enable deployment
      Deployment path: /home/altosujd/repositories/alto-app

STEP 3 — Setup Node.js App (cPanel UI)
--------------------------------------
  cPanel → Software → Setup Node.js App → Create Application

    Node.js version:     22.x
    Application mode:    Production
    Application root:    repositories/alto-app
    Application URL:     altorich.com (or your domain root)
    Application startup: server.js

    Environment variables — set ALL of these in the Node.js UI (required for auth):
      NODE_ENV=production
      HOSTNAME=0.0.0.0
      NEXT_PUBLIC_SITE_URL=https://altorich.com
      NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
      NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   (anon JWT)
      SUPABASE_SERVICE_ROLE_KEY=eyJ...       (service_role JWT — NOT anon)
      RESEND_API_KEY=re_...                  (email OTP)
      NEXT_PUBLIC_ROI_MODE_ENABLED=true
      ALTORICH_LOG_DIR=/home/altosujd/logs

    Also keep /home/altosujd/repositories/alto-app/.env.production as backup.

    CloudLinux: node_modules must be a symlink. Never leave a real node_modules folder.
    After npm in terminal: rm -rf node_modules → Run NPM Install in cPanel.

STEP 3b — Production build on CloudLinux
----------------------------------------
  source /home/altosujd/nodevenv/repositories/alto-app/22/bin/activate
  cd /home/altosujd/repositories/alto-app
  npm install --include=dev
  rm -f node_modules && cp -a .../22/lib/node_modules ./node_modules
  export NODE_OPTIONS="--max-old-space-size=768"
  npx next build
  rm -rf node_modules
  # cPanel → Run NPM Install → RESTART

  Verify env: node scripts/deploy/verify-production-env.mjs

STEP 4 — Logs directory
-----------------------
  ssh altosujd@162.254.39.13 -p 21098 "mkdir -p /home/altosujd/logs && chmod 755 /home/altosujd/logs"

  App logs:
    /home/altosujd/logs/altorich-error.log
    /home/altosujd/logs/altorich-app.log
    /home/altosujd/logs/deploy.log

STEP 5 — Local push
-------------------
  bash scripts/deploy/setup-remote.sh
  git add -A && git commit -m "Deploy AltoRich to cPanel"
  git push production main

STEP 6 — Verify
---------------
  bash scripts/deploy/verify-deploy.sh
  # or quick health only:
  node scripts/test-deploy.js https://altorich.com/api/health

Manual Node refresh (no rebuild):
  bash scripts/deploy/refresh-node-app.sh

GitHub auto-deploy (optional):
  Add repository secret CPANEL_DEPLOY_KEY (cPanel SSH private key).
  Pushes to main trigger .github/workflows/deploy-production.yml.

================================================================================
EOF
