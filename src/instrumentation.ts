export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { createRequire } = await import("node:module");
    const require = createRequire(import.meta.url);
    require("../../scripts/deploy/load-env.js");

    const { validateServerEnv } = await import("@/lib/env");
    validateServerEnv();
  }
}
