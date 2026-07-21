import type { Session } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Database } from "@/types/database";
import { AppError, Errors } from "@/lib/errors";
import { isSupabaseConfigured } from "@/lib/env";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

/**
 * Persist a Supabase session into auth cookies for the current response.
 * Never swallow cookie-write failures — that causes "login succeeds then bounce".
 */
export async function applySessionToCookies(
  session: Session | null | undefined,
  response?: NextResponse
) {
  if (!session?.access_token || !session.refresh_token) {
    throw new AppError("Sign-in did not return a session.", 500, "SESSION_MISSING");
  }
  if (!isSupabaseConfigured()) throw Errors.notConfigured();

  const cookieStore = await cookies();
  const written: CookieToSet[] = [];

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
            written.push({ name, value, options });
            if (response) {
              response.cookies.set(name, value, options);
            }
          }
        }
      }
    }
  );

  const { error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token
  });
  if (error) throw new AppError(error.message, 500, "SESSION_ERROR");

  if (written.length === 0) {
    throw new AppError(
      "Sign-in could not establish a secure session. Please try again.",
      500,
      "SESSION_COOKIE_MISSING"
    );
  }

  // Confirm the cookie jar now carries a readable session for this response cycle.
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new AppError(
      userError?.message || "Sign-in session could not be verified.",
      500,
      "SESSION_VERIFY_FAILED"
    );
  }

  return { userId: user.id, cookiesWritten: written.length };
}

/** JSON auth success response with session cookies attached. */
export async function authJsonResponse(
  body: Record<string, unknown>,
  session: Session | null | undefined,
  init?: { status?: number }
) {
  const response = NextResponse.json(body, { status: init?.status ?? 200 });
  await applySessionToCookies(session, response);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
