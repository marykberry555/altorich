import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const protectedRoutes = [
  "/dashboard",
  "/wallet",
  "/portfolio",
  "/deposits",
  "/withdrawals",
  "/profile",
  "/team",
  "/vip",
  "/activities",
  "/settings",
  "/notifications"
];
const adminRoutes = ["/admin"];
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

export async function middleware(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (authRoutes.some((route) => pathname.startsWith(route))) {
    return response;
  }

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAdmin = adminRoutes.some((route) => pathname.startsWith(route));

  if (!isProtected && !isAdmin) {
    return response;
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return response;
  }

  if (!user) {
    const loginUrl = isAdmin ? new URL("/hard/auth", request.url) : new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (supabase && isProtected) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("must_change_pin, must_change_password")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.must_change_pin && !pathname.startsWith("/auth/change-pin")) {
      return NextResponse.redirect(new URL("/auth/change-pin", request.url));
    }
  }

  if (isAdmin && supabase) {
    const { data: isAdminRole } = await supabase.rpc("has_admin_role");
    if (!isAdminRole) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("must_change_password")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.must_change_password && !pathname.startsWith("/auth/change-password")) {
      const changeUrl = new URL("/auth/change-password", request.url);
      changeUrl.searchParams.set("admin", "1");
      return NextResponse.redirect(changeUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
