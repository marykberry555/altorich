import { z } from "zod";
import { logger } from "@/lib/logger";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("https://altorich.com"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SMARTSUPP_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_ROI_MODE_ENABLED: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true")
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional()
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

const REQUIRED_IN_PRODUCTION = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY"
] as const;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isServiceRoleConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

const DEFAULT_PUBLIC_ENV: PublicEnv = {
  NEXT_PUBLIC_SITE_URL: "https://altorich.com",
  NEXT_PUBLIC_SUPABASE_URL: undefined,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
  NEXT_PUBLIC_SMARTSUPP_KEY: undefined,
  NEXT_PUBLIC_ROI_MODE_ENABLED: false
};

/** Public env — safe for browser bundles */
export function getPublicEnv(): PublicEnv {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SMARTSUPP_KEY: process.env.NEXT_PUBLIC_SMARTSUPP_KEY,
    NEXT_PUBLIC_ROI_MODE_ENABLED: process.env.NEXT_PUBLIC_ROI_MODE_ENABLED
  });

  if (!parsed.success) {
    logger.warn("Invalid public environment configuration; using safe defaults", {
      issues: parsed.error.issues.map((issue) => issue.path.join("."))
    });
    return DEFAULT_PUBLIC_ENV;
  }

  return parsed.data;
}

/** Server-only env — never import from client components */
export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SMARTSUPP_KEY: process.env.NEXT_PUBLIC_SMARTSUPP_KEY,
    NEXT_PUBLIC_ROI_MODE_ENABLED: process.env.NEXT_PUBLIC_ROI_MODE_ENABLED,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY
  });
}

/**
 * Validates required variables at startup.
 * Production: throws on missing required vars.
 * Development: logs clear errors but allows the app to run with setup banners.
 */
export function validateServerEnv(): void {
  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]);

  if (missing.length === 0) {
    return;
  }

  const message = [
    "[AltoRich] Missing required environment variables:",
    ...missing.map((key) => `  • ${key}`),
    "",
    "Copy .env.local.example to .env.local and fill in your Supabase credentials.",
    "Server-only secrets (SUPABASE_SERVICE_ROLE_KEY) must never be exposed to the browser."
  ].join("\n");

  if (process.env.NODE_ENV === "production") {
    throw new Error(message);
  }

   
  console.error(message);
}

/** @deprecated Use getPublicEnv or getServerEnv */
export function getEnv(): ServerEnv {
  return getServerEnv();
}
