#!/usr/bin/env node
/**
 * Static regression: fail if pin_hash may leak via profiles SELECT * returning rows.
 * Count-only (head: true) queries are allowed.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const failures = [];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === "test-results") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/\.(ts|tsx)$/.test(name)) files.push(p);
  }
  return files;
}

const ALLOW = new Set(["src/services/auth/auth.service.ts"]);
const files = [...walk(join(ROOT, "src/app/api")), ...walk(join(ROOT, "src/services"))];

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const rel = relative(ROOT, file);
  if (ALLOW.has(rel)) continue;

  const re = /\.from\(\s*["']profiles["']\s*\)([\s\S]*?)(?=\.from\(|;|\n\s*(?:const|let|return|if|await\s+this|await\s+services)|\n\s*$)/g;
  let match;
  while ((match = re.exec(text))) {
    const chunk = match[1].slice(0, 350);
    const selectStar = /\.select\(\s*["']\*["']/.test(chunk);
    const emptySelect = /\.select\(\s*\)/.test(chunk);
    const headOnly = /head:\s*true/.test(chunk);
    const usesWhitelist = /PROFILE_SAFE_COLUMNS/.test(chunk) || /\.select\(\s*["']id,/.test(chunk);

    if (selectStar && !headOnly) {
      failures.push(`${rel}: profiles SELECT * (row fetch — may leak pin_hash)`);
    }
    if (emptySelect && !usesWhitelist) {
      failures.push(`${rel}: profiles .select() without whitelist`);
    }
  }
}

const safe = readFileSync(join(ROOT, "src/lib/security/profile-safe.ts"), "utf8");
const columnsMatch = safe.match(/export const PROFILE_SAFE_COLUMNS\s*=\s*["']([^"']+)["']/);
if (!columnsMatch) {
  failures.push("profile-safe.ts: PROFILE_SAFE_COLUMNS not found");
} else if (columnsMatch[1].includes("pin_hash")) {
  failures.push("profile-safe.ts: PROFILE_SAFE_COLUMNS includes pin_hash");
}

if (failures.length) {
  console.error("PIN HASH REGRESSION FAILURES:");
  for (const f of [...new Set(failures)]) console.error(" -", f);
  process.exit(1);
}

console.log("PASS pin_hash static regression (", files.length, "files scanned)");
