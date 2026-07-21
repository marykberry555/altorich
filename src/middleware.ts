import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { HARD_OPS_HOME } from "@/lib/hard-ops";
import { ADMIN_APP_HOME, ADMIN_APP_INSTALL } from "@/lib/admin-app/constants";
import { buildPublicUrl } from "@/lib/request-url";
import { applyDocumentNoStoreHeaders } from "@/lib/cache/response-headers";
import { botBlockedResponse, isBlockedBot, isSocialPreviewBot, X_ROBOTS_TAG } from "@/lib/security/bot-block";
import {
  REFERRAL_COOKIE,
  REFERRAL_TTL_SECONDS,
  buildRegisterUrlWithRef,
  normalizeReferralCode,
  referralCodeFromSearchParams
} from "@/lib/referral/attribution";

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
  "/notifications",
  "/security",
  "/privacy",
  "/documents",
  "/announcements"
];

const authRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-pin",
  "/auth/forgot-username",
  "/auth/change-pin",
  "/auth/change-password",
  "/auth/verify",
  "/auth/verify-device",
  "/hard/auth",
  "/admin/auth",
  "/admin/download",
  "/admin-app/login",
  "/admin-app/install",
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

function isAdminAppPublicAsset(pathname: string) {
  return (
    pathname === `${ADMIN_APP_HOME}/manifest.webmanifest` ||
    pathname === `${ADMIN_APP_HOME}/sw.js` ||
    pathname === `${ADMIN_APP_HOME}/offline.html` ||
    pathname.startsWith(`${ADMIN_APP_HOME}/icon-`) ||
    pathname === `${ADMIN_APP_HOME}/splash.png`
  );
}

function isAdminAppProtectedRoute(pathname: string) {
  if (isAdminAppPublicAsset(pathname)) return false;
  if (pathname === ADMIN_APP_INSTALL || pathname.startsWith("/admin-app/login")) return false;
  return pathname === ADMIN_APP_HOME || pathname.startsWith(`${ADMIN_APP_HOME}/`);
}

async function enforceAdminRoute(
  request: NextRequest,
  supabase: NonNullable<Awaited<ReturnType<typeof updateSession>>["supabase"]>,
  user: NonNullable<Awaited<ReturnType<typeof updateSession>>["user"]>
) {
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

    if (profile?.must_change_password && !request.nextUrl.pathname.startsWith("/auth/change-password")) {
      const changeUrl = buildPublicUrl("/auth/change-password", request);
      changeUrl.searchParams.set("admin", "1");
      return withNoStore(NextResponse.redirect(changeUrl));
    }
  } catch {
    // Allow request through; layout will re-check access.
  }

  return null;
}

function withNoStore(response: NextResponse) {
  response.headers.set("X-Robots-Tag", X_ROBOTS_TAG);
  return applyDocumentNoStoreHeaders(response);
}

function withReferralAttribution(request: NextRequest, response: NextResponse) {
  const fromQuery = referralCodeFromSearchParams(request.nextUrl.searchParams);
  const pathMatch = request.nextUrl.pathname.match(/^\/r\/([A-Za-z0-9_-]+)/i);
  const fromPath = normalizeReferralCode(pathMatch?.[1] ?? null);
  const code = fromQuery ?? fromPath;
  if (code) {
    response.cookies.set(REFERRAL_COOKIE, code, {
      path: "/",
      maxAge: REFERRAL_TTL_SECONDS,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
  }
  return withNoStore(response);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get("user-agent");

  if (isBlockedBot(userAgent, pathname)) {
    return botBlockedResponse();
  }

  // Short referral links: humans go to signup; social crawlers stay for Open Graph HTML.
  const referralPath = pathname.match(/^\/r\/([A-Za-z0-9_-]+)/i);
  if (referralPath) {
    const code = normalizeReferralCode(referralPath[1]);
    if (code && !isSocialPreviewBot(userAgent)) {
      const target = buildPublicUrl(buildRegisterUrlWithRef(code), request);
      return withReferralAttribution(request, NextResponse.redirect(target));
    }
  }

  if (pathname === "/admin") {
    return withReferralAttribution(request, NextResponse.redirect(buildPublicUrl("/admin/auth", request), 308));
  }

  // Public admin surfaces kept on /admin/* (auth + APK download). Everything else
  // under /admin maps into the installable admin-app console.
  if (
    pathname.startsWith("/admin/") &&
    !pathname.startsWith("/admin/auth") &&
    !pathname.startsWith("/admin/download")
  ) {
    const target = pathname.replace(/^\/admin/, ADMIN_APP_HOME) || ADMIN_APP_HOME;
    return withReferralAttribution(request, NextResponse.redirect(buildPublicUrl(target, request), 308));
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
      return withReferralAttribution(
        request,
        NextResponse.redirect(buildPublicUrl(isAdminRole ? ADMIN_APP_HOME : "/dashboard", request))
      );
    }
    return withReferralAttribution(request, response);
  }

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isHardOps = isHardOpsRoute(pathname);
  const isAdminApp = isAdminAppProtectedRoute(pathname);

  if (!isProtected && !isHardOps && !isAdminApp) {
    return withReferralAttribution(request, response);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Service unavailable", { status: 503 });
    }
    return withReferralAttribution(request, response);
  }

  if (!user) {
    if (isAdminApp && pathname === ADMIN_APP_HOME) {
      return withReferralAttribution(request, NextResponse.redirect(buildPublicUrl(ADMIN_APP_INSTALL, request)));
    }
    const loginUrl = buildPublicUrl(isAdminApp ? "/admin/auth" : "/auth/login", request);
    loginUrl.searchParams.set("redirect", pathname);
    return withReferralAttribution(request, NextResponse.redirect(loginUrl));
  }

  if (supabase && isProtected) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("must_change_pin, must_change_password")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.must_change_pin && !pathname.startsWith("/auth/change-pin")) {
      return withReferralAttribution(request, NextResponse.redirect(buildPublicUrl("/auth/change-pin", request)));
    }
  }

  if (isHardOps && supabase) {
    const denied = await enforceAdminRoute(request, supabase, user);
    if (denied) return withReferralAttribution(request, denied);
  }

  if (isAdminApp && supabase) {
    const denied = await enforceAdminRoute(request, supabase, user);
    if (denied) return withReferralAttribution(request, denied);
  }

  return withReferralAttribution(request, response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|site.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|ico|webmanifest)$).*)"]
};
