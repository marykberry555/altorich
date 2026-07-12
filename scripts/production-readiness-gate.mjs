#!/usr/bin/env node
/**
 * Production readiness gate — blocks deploy when trust-breaking issues are found.
 * Usage: node scripts/production-readiness-gate.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const MAX_FILE_BYTES = 512_000;
const SOURCE_EXT = /\.(tsx?|jsx?)$/;

const ALLOWLIST = new Map([
  ["src/services/auth/auth.service.ts", [/localhost/i]],
  ["src/lib/env.ts", [/localhost/i, /\.env\.local/]],
  ["src/lib/supabase/client.ts", [/not configured/i]],
  ["src/lib/request-url.ts", [/0\.0\.0\.0/, /127\.0\.0\.1/, /localhost/]]
]);

const CHECKS = [
  {
    id: "dev-host-0.0.0.0",
    pattern: /0\.0\.0\.0(?::\d+)?/g,
    message: "Development bind address 0.0.0.0 must not appear in user-facing code"
  },
  {
    id: "dev-host-localhost",
    pattern: /https?:\/\/localhost(?::\d+)?/gi,
    message: "Hardcoded localhost URL"
  },
  {
    id: "dev-host-127",
    pattern: /https?:\/\/127\.0\.0\.1(?::\d+)?/gi,
    message: "Hardcoded 127.0.0.1 URL"
  },
  {
    id: "dev-port-3000",
    pattern: /https?:\/\/[^/\s"']+:3000/gi,
    message: "Hardcoded :3000 development URL"
  },
  {
    id: "todo-comment",
    pattern: /\bTODO\b|\bFIXME\b|\bHACK\b/g,
    message: "Unresolved developer TODO/FIXME"
  },
  {
    id: "coming-soon",
    pattern: /coming soon/i,
    message: "Placeholder 'coming soon' copy"
  },
  {
    id: "configure-admin",
    pattern: /configure in admin/i,
    message: "Developer-facing 'configure in admin' copy"
  },
  {
    id: "dummy-text",
    pattern: /\bdummy data\b|\btest data\b|\bmock text\b/i,
    message: "Dummy/test/mock placeholder text"
  },
  {
    id: "request-origin-antipattern",
    pattern: /const\s*\{\s*origin\s*\}\s*=\s*new\s+URL\(request\.url\)/g,
    message: "Unsafe request.url origin — use getPublicOrigin() or redirectToPath()"
  }
];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next") continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (SOURCE_EXT.test(entry) && stat.size <= MAX_FILE_BYTES && !entry.endsWith(".test.ts")) files.push(full);
  }
  return files;
}

function isAllowed(relPath, line) {
  const rules = ALLOWLIST.get(relPath);
  if (!rules) return false;
  return rules.some((rule) => rule.test(line));
}

function scanFile(path) {
  const rel = relative(ROOT, path).replace(/\\/g, "/");
  const content = readFileSync(path, "utf8");
  const lines = content.split("\n");
  const findings = [];

  for (const check of CHECKS) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isAllowed(rel, line)) continue;
      if (check.pattern.test(line)) {
        if (check.pattern.global) check.pattern.lastIndex = 0;
        findings.push({
          file: rel,
          line: i + 1,
          check: check.id,
          message: check.message,
          excerpt: line.trim().slice(0, 120)
        });
      }
    }
  }

  return findings;
}

function main() {
  console.log("AltoRich production readiness gate\n");

  const srcDir = join(ROOT, "src");
  const files = walk(srcDir);
  const findings = files.flatMap(scanFile);

  if (findings.length === 0) {
    console.log(`PASS: scanned ${files.length} source files — no trust-breaking issues found.`);
    process.exit(0);
  }

  console.error(`FAIL: ${findings.length} issue(s) found:\n`);
  for (const item of findings) {
    console.error(`• [${item.check}] ${item.file}:${item.line}`);
    console.error(`  ${item.message}`);
    console.error(`  ${item.excerpt}\n`);
  }

  process.exit(1);
}

main();
