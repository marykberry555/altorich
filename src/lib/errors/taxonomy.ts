export type ErrorCategory =
  | "authentication"
  | "network"
  | "validation"
  | "business"
  | "server"
  | "not_found";

export type ErrorNextAction = {
  label: string;
  href?: string;
  action?: "retry" | "signin" | "support";
};

export type MemberErrorCopy = {
  category: ErrorCategory;
  title: string;
  body: string;
  nextActions: ErrorNextAction[];
};

const SUPPORT_HREF = "/contact";
const SIGN_IN_HREF = "/login";
const DASHBOARD_HREF = "/dashboard";

export function makeErrorReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 6; i += 1) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)]!;
  }
  return `AR-${id}`;
}

export function memberCopyForCategory(category: ErrorCategory, detail?: string): MemberErrorCopy {
  switch (category) {
    case "authentication":
      return {
        category,
        title: "Session expired",
        body: detail?.trim() || "Your session has expired. Please sign in again.",
        nextActions: [{ label: "Sign In", href: SIGN_IN_HREF, action: "signin" }]
      };
    case "network":
      if (detail === "timeout") {
        return {
          category,
          title: "Still connecting",
          body: "Your network is slow right now. Please wait a moment and try again — your money and account are safe.",
          nextActions: [
            { label: "Retry", action: "retry" },
            { label: "Dashboard", href: DASHBOARD_HREF }
          ]
        };
      }
      if (detail === "offline") {
        return {
          category,
          title: "You're offline",
          body: "Reconnect to the internet, then try again. Cached pages may still work while you wait.",
          nextActions: [{ label: "Retry", action: "retry" }]
        };
      }
      if (detail === "chunk") {
        return {
          category,
          title: "Updating Alto Rich",
          body: "A new version is loading. This page will refresh automatically — please wait a second.",
          nextActions: [{ label: "Refresh now", action: "retry" }]
        };
      }
      return {
        category,
        title: "Couldn't reach Alto Rich",
        body:
          detail?.trim() ||
          "We couldn't complete that request yet. This is often a brief delay on slow networks — tap Retry.",
        nextActions: [
          { label: "Retry", action: "retry" },
          { label: "Dashboard", href: DASHBOARD_HREF }
        ]
      };
    case "validation":
      return {
        category,
        title: "Check your details",
        body: detail?.trim() || "Please review the highlighted fields and try again.",
        nextActions: [{ label: "Retry", action: "retry" }]
      };
    case "business":
      return {
        category,
        title: "Unable to continue",
        body: detail?.trim() || "This action can't be completed right now.",
        nextActions: [
          { label: "Retry", action: "retry" },
          { label: "Dashboard", href: DASHBOARD_HREF }
        ]
      };
    case "not_found":
      return {
        category,
        title: "Page not found",
        body: detail?.trim() || "We couldn't find what you were looking for.",
        nextActions: [
          { label: "Dashboard", href: DASHBOARD_HREF },
          { label: "Contact Support", href: SUPPORT_HREF, action: "support" }
        ]
      };
    case "server":
    default:
      return {
        category: "server",
        title: "Couldn't load this page",
        body:
          detail?.trim() ||
          "Something interrupted this screen. Your money and account are safe — tap Retry, or open the Dashboard.",
        nextActions: [
          { label: "Retry", action: "retry" },
          { label: "Dashboard", href: DASHBOARD_HREF },
          { label: "Contact Support", href: SUPPORT_HREF, action: "support" }
        ]
      };
  }
}

/** Security-aware member messaging for HTTP status codes. */
export function memberCopyForHttpStatus(status: number, detail?: string): MemberErrorCopy {
  if (status === 401) {
    return {
      category: "authentication",
      title: "Session expired",
      body: detail?.trim() || "Your session has expired. Please sign in again to continue.",
      nextActions: [{ label: "Sign In", href: SIGN_IN_HREF, action: "signin" }]
    };
  }
  if (status === 403) {
    return {
      category: "authentication",
      title: "Access denied",
      body:
        detail?.trim() ||
        "You don't have permission to view or change this. If you believe this is a mistake, contact support.",
      nextActions: [
        { label: "Dashboard", href: DASHBOARD_HREF },
        { label: "Contact Support", href: SUPPORT_HREF, action: "support" }
      ]
    };
  }
  if (status === 404) {
    return memberCopyForCategory("not_found", detail);
  }
  return memberCopyForCategory(classifyHttpStatus(status), detail);
}

/** Map application error codes to professional member guidance. */
export function memberCopyForAppCode(code?: string, detail?: string, status?: number): MemberErrorCopy {
  const c = (code ?? "").toUpperCase();
  if (c === "SESSION_EXPIRED" || c === "UNAUTHORIZED") {
    return memberCopyForHttpStatus(401, detail);
  }
  if (c === "FORBIDDEN" || c === "PERMISSION_DENIED" || c === "NAME_LOCKED") {
    return memberCopyForHttpStatus(403, detail);
  }
  if (c === "VERIFICATION_REQUIRED" || c === "EMAIL_NOT_VERIFIED") {
    return {
      category: "business",
      title: "Verification required",
      body:
        detail?.trim() ||
        "Please verify your email address before continuing. Check your inbox for a verification link.",
      nextActions: [
        { label: "Security Center", href: "/security" },
        { label: "Contact Support", href: SUPPORT_HREF, action: "support" }
      ]
    };
  }
  if (c === "ACTION_UNAVAILABLE" || c === "NOT_CONFIGURED") {
    return {
      category: "business",
      title: "Action unavailable",
      body: detail?.trim() || "This feature isn't available right now. Please try again later or contact support.",
      nextActions: [
        { label: "Dashboard", href: DASHBOARD_HREF },
        { label: "Contact Support", href: SUPPORT_HREF, action: "support" }
      ]
    };
  }
  if (status != null) return memberCopyForHttpStatus(status, detail);
  return memberCopyForCategory(classifyAppErrorCode(code, status), detail);
}

export function classifyHttpStatus(status: number): ErrorCategory {
  if (status === 401 || status === 403) return "authentication";
  if (status === 404) return "not_found";
  if (status === 400 || status === 422) return "validation";
  if (status === 408 || status === 429 || status >= 502) return "network";
  if (status === 409 || status === 402) return "business";
  if (status >= 500) return "server";
  return "business";
}

export function classifyThrownError(error: unknown): ErrorCategory {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const lower = message.toLowerCase();
  const digest =
    error && typeof error === "object" && "digest" in error
      ? String((error as { digest?: string }).digest ?? "")
      : "";

  if (
    /Loading chunk [\d]+ failed|ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed/i.test(
      message
    )
  ) {
    return "network"; // RouteErrorFallback maps chunk → "Updating Alto Rich"
  }
  if (
    /failed to fetch|networkerror|load failed|timeout|timed out|offline|err_network/i.test(lower)
  ) {
    return "network";
  }
  // Opaque Next.js RSC digests are often transient render failures — treat as recoverable network/server.
  if (!message.trim() && digest) {
    return "server";
  }
  if (/unauthorized|session|jwt|auth|sign in|forbidden|not authenticated/i.test(lower)) {
    return "authentication";
  }
  if (/not found|404/i.test(lower)) {
    return "not_found";
  }
  if (/insufficient|minimum|pending|already active|name mismatch|invalid account|balance/i.test(lower)) {
    return "business";
  }
  if (/invalid|required|missing|validation|zod/i.test(lower)) {
    return "validation";
  }
  return "server";
}

export function classifyAppErrorCode(code?: string, status?: number): ErrorCategory {
  if (!code && status != null) return classifyHttpStatus(status);
  const c = (code ?? "").toUpperCase();
  if (["UNAUTHORIZED", "FORBIDDEN", "SESSION_EXPIRED", "NAME_LOCKED"].includes(c)) return "authentication";
  if (["VERIFICATION_REQUIRED", "EMAIL_NOT_VERIFIED"].includes(c)) return "business";
  if (["NOT_FOUND"].includes(c)) return "not_found";
  if (["BAD_REQUEST", "VALIDATION"].includes(c)) return "validation";
  if (["CONFLICT", "INSUFFICIENT_BALANCE", "BUSINESS_RULE", "ACTION_UNAVAILABLE"].includes(c)) return "business";
  if (["NOT_CONFIGURED", "INTERNAL"].includes(c)) return "server";
  if (c === "PERMISSION_DENIED") return "authentication";
  if (status != null) return classifyHttpStatus(status);
  return "server";
}
