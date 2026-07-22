/**
 * Set known PIN on altorich_ops for local incident verification only.
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes, scryptSync } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return process.env;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    if (!process.env[key]) process.env[key] = trimmed.slice(eq + 1);
  }
  return process.env;
}

loadEnv();

function hashPin(pin) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(pin, salt, 64).toString("hex")}`;
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const { error } = await supabase
  .from("profiles")
  .update({ pin_hash: hashPin("123456"), must_change_password: false, must_change_pin: false })
  .eq("username", "altorich_ops");

if (error) {
  console.error(error);
  process.exit(1);
}
console.log("altorich_ops PIN set to 123456 for incident verification");
