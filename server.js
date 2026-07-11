/**
 * cPanel / Phusion Passenger entry point for Next.js (Namecheap Node.js hosting).
 *
 * Standard production (Vercel, Docker, most hosts): use `npm start` instead.
 * Configure cPanel "Application startup file" to: server.js
 */
require("./scripts/deploy/load-env");

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const { logError, logInfo } = require("./scripts/deploy/logger");

const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== "production";

const app = next({ dev, hostname, port, dir: __dirname });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        logError("request_handler", err, { url: req.url, method: req.method });
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    }).listen(port, hostname, (err) => {
      if (err) {
        logError("server_listen", err);
        throw err;
      }
      logInfo("server", `AltoRich ready on ${hostname}:${port}`, { nodeEnv: process.env.NODE_ENV });
    });
  })
  .catch((err) => {
    logError("next_prepare", err);
    process.exit(1);
  });
