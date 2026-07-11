import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { HARD_OPS_HOME } from "@/lib/hard-ops";
import { buildPublicUrl } from "@/lib/request-url";
import { applyDocumentNoStoreHeaders } from "@/lib/cache/response-headers";

const protectedRoutes = [
  "/dashboard",
  "/wallet",
  "/portfolio",
  "/investments",
  "/deposits",
  "/withdrawals",
  "/profile",
  "/team",
  "/vip",
  "/activities",
  "/settings",
  "/notifications"
];

const authRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-pin",
  "/auth/forgot-username",
  "/auth/change-pin",
  "/auth/change-password",
  "/auth/verify",
  "/hard/auth",
  "/login",
  "/signup",
  "/auth/callback",
  "/forgot-password",
  "/reset-password",
  "/verify-email"
];

function isHardOpsRoute(pathname: string) {
  return pathname === HARD_OPS_HOME || (pathname.startsWith(`${HARD_OPS_HOME}/`) && !pathname.startsWith("/hard/auth"));
}

function withNoStore(response: NextResponse) {
  return applyDocumentNoStoreHeaders(response);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const target = pathname.replace(/^\/admin/, HARD_OPS_HOME) || HARD_OPS_HOME;
    return withNoStore(NextResponse.redirect(buildPublicUrl(target, request), 308));
  }

  const { response, user, supabase } = await updateSession(request);

  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (user && pathname.startsWith("/auth/login")) {
      let isAdminRole = false;
      if (supabase) {
        try {
          const { data } = await supabase.rpc("has_admin_role");
          isAdminRole = Boolean(data);
        } catch {
          isAdminRole = false;
        }
      }
      return withNoStore(NextResponse.redirect(buildPublicUrl(isAdminRole ? HARD_OPS_HOME : "/dashboard", request)));
    }
    return withNoStore(response);
  }

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isHardOps = isHardOpsRoute(pathname);

  if (!isProtected && !isHardOps) {
    return withNoStore(response);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return withNoStore(response);
  }

  if (!user) {
    const loginUrl = buildPublicUrl("/auth/login", request);
    loginUrl.searchParams.set("redirect", pathname);
    return withNoStore(NextResponse.redirect(loginUrl));
  }

  if (supabase && isProtected) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("must_change_pin, must_change_password")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.must_change_pin && !pathname.startsWith("/auth/change-pin")) {
      return withNoStore(NextResponse.redirect(buildPublicUrl("/auth/change-pin", request)));
    }
  }

  if (isHardOps && supabase) {
    let isAdminRole = false;
    try {
      const { data } = await supabase.rpc("has_admin_role");
      isAdminRole = Boolean(data);
    } catch {
      isAdminRole = false;
    }

    if (!isAdminRole) {
      return withNoStore(NextResponse.redirect(buildPublicUrl("/dashboard", request)));
    }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("must_change_password")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.must_change_password && !pathname.startsWith("/auth/change-password")) {
        const changeUrl = buildPublicUrl("/auth/change-password", request);
        changeUrl.searchParams.set("admin", "1");
        return withNoStore(NextResponse.redirect(changeUrl));
      }
    } catch {
      // Allow request through; hard ops layout will re-check access.
    }
  }

  return withNoStore(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|site.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|ico|webmanifest)$).*)"]
};
