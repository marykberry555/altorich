import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_ROI_MODE_ENABLED: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true")
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  PAYSTACK_SECRET_KEY: z.string().min(1).optional()
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

const REQUIRED_IN_PRODUCTION = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY"
] as const;

const RECOMMENDED_IN_PRODUCTION = [
  "PAYSTACK_SECRET_KEY",
  "NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY"
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

export function isPaystackConfigured(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY && process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY);
}

/** Public env — safe for browser bundles */
export function getPublicEnv(): PublicEnv {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
  });
}

/** Server-only env — never import from client components */
export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY
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
    const recommended = RECOMMENDED_IN_PRODUCTION.filter((key) => !process.env[key]);
    if (recommended.length > 0 && process.env.NODE_ENV === "production") {
      // eslint-disable-next-line no-console
      console.warn(
        `[AltoRich] Recommended env vars not set: ${recommended.join(", ")}. Paystack payments will be unavailable.`
      );
    }
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

  // eslint-disable-next-line no-console
  console.error(message);
}

/** @deprecated Use getPublicEnv or getServerEnv */
export function getEnv(): ServerEnv {
  return getServerEnv();
}
