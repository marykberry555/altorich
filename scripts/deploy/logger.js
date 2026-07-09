const fs = require("fs");
const path = require("path");

const LOG_DIR = process.env.ALTORICH_LOG_DIR || "/home/altosujd/logs";
const ERROR_LOG = path.join(LOG_DIR, "altorich-error.log");
const APP_LOG = path.join(LOG_DIR, "altorich-app.log");

function ensureDir() {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch {
    // Ignore — console fallback still works.
  }
}

function write(file, level, tag, message, meta) {
  ensureDir();
  const line =
    JSON.stringify({
      ts: new Date().toISOString(),
      level,
      tag,
      message,
      ...(meta ? { meta } : {})
    }) + "\n";
  try {
    fs.appendFileSync(file, line, "utf8");
  } catch (err) {
    console.error("[logger] failed to write log file", err.message);
  }
}

function logError(tag, err, meta) {
  const message = err instanceof Error ? err.stack || err.message : String(err);
  write(ERROR_LOG, "error", tag, message, meta);
  console.error(`[${tag}]`, message);
}

function logInfo(tag, message, meta) {
  write(APP_LOG, "info", tag, message, meta);
  console.log(`[${tag}]`, message);
}

module.exports = { logError, logInfo, LOG_DIR, ERROR_LOG, APP_LOG };
