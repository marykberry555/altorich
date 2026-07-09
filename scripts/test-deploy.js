#!/usr/bin/env node
/**
 * Post-deployment health check.
 * Usage: node scripts/test-deploy.js [url]
 * Default: DEPLOY_HEALTH_URL or https://altorich.com/api/health
 */
const http = require("http");
const https = require("https");

const target = process.argv[2] || process.env.DEPLOY_HEALTH_URL || "https://altorich.com/api/health";
const timeoutMs = Number(process.env.DEPLOY_HEALTH_TIMEOUT_MS || 15000);

function request(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(url, { timeout: timeoutMs }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks).toString("utf8")
        });
      });
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    });
  });
}

async function main() {
  console.log("AltoRich deploy health check");
  console.log("Target:", target);
  console.log("---");

  const res = await request(target);
  console.log("Status:", res.status);
  console.log("Content-Type:", res.headers["content-type"] || "(none)");
  console.log("Server:", res.headers["server"] || "(none)");
  console.log("Body:", res.body);

  let payload;
  try {
    payload = JSON.parse(res.body);
  } catch {
    payload = null;
  }

  if (res.status !== 200) {
    console.error("\nFAIL: expected HTTP 200");
    process.exit(1);
  }

  if (!payload || payload.status !== "ok") {
    console.error('\nFAIL: expected JSON { "status": "ok" }');
    process.exit(1);
  }

  console.log("\nPASS: deployment health check succeeded.");
}

main().catch((err) => {
  console.error("FAIL:", err.message);
  process.exit(1);
});
