import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { redirectToPath } from "@/lib/request-url";

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service temporarily unavailable." }, { status: 503 });
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    logger.warn("Logout failed", { error: error.message });
    return NextResponse.json({ error: "We could not sign you out. Please try again." }, { status: 500 });
  }

  return redirectToPath("/auth/login", request);
}
