#!/usr/bin/env node
/**
 * Verify production env + Supabase connectivity on the cPanel server.
 * Usage: node scripts/deploy/verify-production-env.mjs
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
require("./load-env.js");

const required = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY"
];

const checks = Object.fromEntries(required.map((key) => [key, Boolean(process.env[key]?.trim())]));
console.log("Environment:");
for (const [key, ok] of Object.entries(checks)) {
  console.log(`  ${ok ? "✓" : "✗"} ${key}`);
}

if (Object.values(checks).some((ok) => !ok)) {
  console.error("\nMissing required variables. Fix .env.production or cPanel Node.js env vars.");
  process.exit(1);
}

const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const { data: demo, error: profileError } = await supabase
  .from("profiles")
  .select("username")
  .eq("username", "demouser")
  .maybeSingle();
if (profileError) {
  console.error("\nDatabase error:", profileError.message);
  process.exit(1);
}
console.log(`\nDemo user: ${demo ? "found" : "NOT FOUND (run npm run seed:auth)"}`);

const { error: authError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
if (authError) {
  console.error("\nAuth admin error:", authError.message);
  console.error("Check SUPABASE_SERVICE_ROLE_KEY is the service_role JWT, not the anon key.");
  process.exit(1);
}

console.log("Auth admin API: OK");
console.log("\nAll production checks passed.");
