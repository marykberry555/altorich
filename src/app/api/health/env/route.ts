import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Safe env probe — reports presence only, never values. */
export async function GET() {
  const keys = [
    "NODE_ENV",
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "RESEND_API_KEY"
  ] as const;

  const env = Object.fromEntries(
    keys.map((key) => [key, Boolean(process.env[key]?.trim())])
  );

  const ready =
    env.NEXT_PUBLIC_SUPABASE_URL &&
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    env.SUPABASE_SERVICE_ROLE_KEY;

  return NextResponse.json({ ready, env }, { status: ready ? 200 : 503 });
}
