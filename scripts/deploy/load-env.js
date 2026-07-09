const fs = require("fs");
const path = require("path");

const candidates = [
  process.env.ALTORICH_ENV_FILE,
  path.join(__dirname, "../../.env.production"),
  "/home/altosujd/alto-app/.env.production"
].filter(Boolean);

function parseEnvFile(filePath) {
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
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
  return true;
}

for (const file of candidates) {
  try {
    parseEnvFile(file);
  } catch {
    // Non-fatal: cPanel UI env vars may already be set.
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
