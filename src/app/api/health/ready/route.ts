import { NextResponse } from "next/server";
import { isServiceRoleConfigured, isSupabaseConfigured } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks = {
    supabasePublic: isSupabaseConfigured(),
    supabaseService: isServiceRoleConfigured(),
    resend: Boolean(process.env.RESEND_API_KEY?.trim()),
    siteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim()),
    cronSecret: Boolean(process.env.CRON_SECRET?.trim())
  };

  let database = false;
  let authAdmin = false;
  let error: string | undefined;

  if (checks.supabaseService) {
    try {
      const supabase = await createServiceClient();
      if (supabase) {
        const { error: dbError } = await supabase.from("profiles").select("id").limit(1);
        database = !dbError;
        if (dbError) error = dbError.message;

        const { error: authError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
        authAdmin = !authError;
        if (authError && !error) error = authError.message;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
  }

  const ok =
    checks.supabasePublic &&
    checks.supabaseService &&
    checks.siteUrl &&
    checks.cronSecret &&
    database &&
    authAdmin;

  return NextResponse.json(
    {
      status: ok ? "ready" : "degraded",
      checks: { ...checks, database, authAdmin },
      error
    },
    { status: ok ? 200 : 503 }
  );
}
