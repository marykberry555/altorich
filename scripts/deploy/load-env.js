const fs = require("fs");
const path = require("path");

const candidates = [
  process.env.ALTORICH_ENV_FILE,
  path.join(__dirname, "../../.env.production"),
  "/home/altosujd/repositories/alto-app/.env.production"
].filter(Boolean);

const FILE_PRIORITY_KEYS = new Set([
  "NODE_ENV",
  "HOSTNAME",
  "PORT",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "NEXT_PUBLIC_ROI_MODE_ENABLED",
  "AUTH_SKIP_DEVICE_OTP",
  "ALTORICH_LOG_DIR"
]);

function parseEnvFile(filePath, fileWins = false) {
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (fileWins && FILE_PRIORITY_KEYS.has(key)) {
      process.env[key] = value;
    } else if (!process.env[key]?.trim()) {
      process.env[key] = value;
    }
  }
  return true;
}

for (const file of candidates) {
  try {
    parseEnvFile(file, false);
  } catch {
    // Non-fatal: cPanel UI env vars may already be set.
  }
}

// .env.production on disk wins for server secrets (cPanel UI may be stale).
for (const file of candidates) {
  try {
    parseEnvFile(file, true);
  } catch {
    // Non-fatal
  }
}

try {
  const { logError } = require("./logger");
  process.on("uncaughtException", (err) => logError("uncaughtException", err));
  process.on("unhandledRejection", (reason) =>
    logError(
      "unhandledRejection",
      reason instanceof Error ? reason : new Error(String(reason))
    )
  );
} catch {
  // Logger may be unavailable during first boot.
}
