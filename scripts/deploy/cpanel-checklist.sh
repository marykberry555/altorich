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
      Deployment path: /home/altosujd/alto-app

STEP 3 — Setup Node.js App (cPanel UI)
--------------------------------------
  cPanel → Software → Setup Node.js App → Create Application

    Node.js version:     20.x (or latest LTS available)
    Application mode:    Production
    Application root:    /home/altosujd/alto-app
    Application URL:     altorich.com (or your domain root)
    Application startup: server.js

    Environment variables (set in UI — do NOT commit secrets):
      NODE_ENV=production
      NEXT_PUBLIC_SITE_URL=https://altorich.com
      NEXT_PUBLIC_SUPABASE_URL=...
      NEXT_PUBLIC_SUPABASE_ANON_KEY=...
      SUPABASE_SERVICE_ROLE_KEY=...
      NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=...   (optional)
      PAYSTACK_SECRET_KEY=...             (optional)
      RESEND_API_KEY=...                  (optional)
      NEXT_PUBLIC_ROI_MODE_ENABLED=true   (optional)

    Alternative: create /home/altosujd/alto-app/.env.production on server only.

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
  node scripts/test-deploy.js https://altorich.com/api/health

================================================================================
EOF
