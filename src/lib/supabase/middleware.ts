import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import type { User } from "@supabase/supabase-js";

export type SessionResult = {
  response: NextResponse;
  user: User | null;
  supabase: ReturnType<typeof createServerClient<Database>> | null;
};

export async function updateSession(request: NextRequest): Promise<SessionResult> {
  const requestHeaders = new Headers(request.headers);
  if (!requestHeaders.get("x-request-id")) {
    const { createRequestId } = await import("@/lib/observability/request-id");
    requestHeaders.set("x-request-id", createRequestId());
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders }
  });
  supabaseResponse.headers.set("x-request-id", requestHeaders.get("x-request-id")!);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { response: supabaseResponse, user: null, supabase: null };
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders }
          });
          supabaseResponse.headers.set("x-request-id", requestHeaders.get("x-request-id")!);
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  try {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    return { response: supabaseResponse, user, supabase };
  } catch {
    return { response: supabaseResponse, user: null, supabase };
  }
}
