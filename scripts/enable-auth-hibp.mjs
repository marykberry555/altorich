#!/usr/bin/env node
/**
 * Enable Supabase Auth leaked-password protection (HaveIBeenPwned) on the linked project.
 * Requires SUPABASE_ACCESS_TOKEN with project management permissions.
 *
 * Usage: node scripts/enable-auth-hibp.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF ?? "zqnuvqfzdzoxkdmcijpp";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadEnv();
  const token = TOKEN ?? process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    console.error("SUPABASE_ACCESS_TOKEN is required.");
    console.error("Dashboard fallback: Auth → Providers → Email → Prevent use of leaked passwords.");
    process.exit(1);
  }

  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      password_hibp_enabled: true,
      password_min_length: 8
    })
  });

  const body = await res.text();
  if (!res.ok) {
    console.error(`Failed to update auth config (HTTP ${res.status}):`);
    console.error(body);
    console.error("\nIf HIBP requires Pro plan, enable manually in Supabase Dashboard.");
    process.exit(1);
  }

  console.log("Auth config updated: leaked password protection enabled (HIBP).");
  console.log(body.slice(0, 400));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
