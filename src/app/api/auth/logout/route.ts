import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    logger.warn("Logout failed", { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.redirect(`${origin}/auth/login`, { status: 302 });
}
