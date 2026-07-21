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
  action?: "retry" | "signin" | "support" | "home" | "dashboard";
};

export type MemberErrorCopy = {
  category: ErrorCategory;
  title: string;
  body: string;
  nextActions: ErrorNextAction[];
};

const SUPPORT_HREF = "/contact";
const SIGN_IN_HREF = "/auth/login";
const DASHBOARD_HREF = "/dashboard";
const HOME_HREF = "/";

export function makeErrorReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 6; i += 1) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)]!;
  }
  return `AR-${id}`;
}

/**
 * Member-facing copy only — never framework wording, never "money is safe" language.
 */
export function memberCopyForCategory(category: ErrorCategory, detail?: string): MemberErrorCopy {
  switch (category) {
    case "authentication":
      return {
        category,
        title: "Please sign in to continue",
        body: detail?.trim() || "Your session needs a quick refresh. Sign in again to pick up where you left off.",
        nextActions: [{ label: "Sign in", href: SIGN_IN_HREF, action: "signin" }]
      };
    case "network":
      if (detail === "timeout") {
        return {
          category,
          title: "Still connecting",
          body: "This is taking a little longer than usual. We'll keep trying — you can also refresh this page.",
          nextActions: [
            { label: "Refresh page", action: "retry" },
            { label: "Return to dashboard", href: DASHBOARD_HREF, action: "dashboard" }
          ]
        };
      }
      if (detail === "offline") {
        return {
          category,
          title: "Reconnecting securely",
          body: "We're waiting for your connection to return. This page will continue automatically when you're back online.",
          nextActions: [{ label: "Refresh page", action: "retry" }]
        };
      }
      if (detail === "chunk" || detail === "refreshing") {
        return {
          category,
          title: "Refreshing your experience",
          body: "We're preparing the latest version of Alto Rich. This only takes a moment.",
          nextActions: [{ label: "Continue", href: HOME_HREF, action: "home" }]
        };
      }
      return {
        category,
        title: "We're reconnecting to our services",
        body:
          detail?.trim() ||
          "We're temporarily unable to load this information. Please refresh, or return to your dashboard.",
        nextActions: [
          { label: "Refresh page", action: "retry" },
          { label: "Return to dashboard", href: DASHBOARD_HREF, action: "dashboard" }
        ]
      };
    case "validation":
      return {
        category,
        title: "Check your details",
        body: detail?.trim() || "Please review the highlighted fields and continue.",
        nextActions: [{ label: "Continue", action: "retry" }]
      };
    case "business":
      return {
        category,
        title: "Unable to continue",
        body: detail?.trim() || "This action can't be completed right now. Please try again shortly.",
        nextActions: [
          { label: "Try again", action: "retry" },
          { label: "Return to dashboard", href: DASHBOARD_HREF, action: "dashboard" }
        ]
      };
    case "not_found":
      return {
        category,
        title: "This page isn't available",
        body: detail?.trim() || "That link may have moved. Head back to the dashboard or home page.",
        nextActions: [
          { label: "Return to dashboard", href: DASHBOARD_HREF, action: "dashboard" },
          { label: "Go home", href: HOME_HREF, action: "home" }
        ]
      };
    case "server":
    default:
      return {
        category: "server",
        title: "We're preparing this page",
        body:
          detail?.trim() ||
          "We're temporarily unable to load this information. Refresh the page, or return to your dashboard.",
        nextActions: [
          { label: "Refresh page", action: "retry" },
          { label: "Return to dashboard", href: DASHBOARD_HREF, action: "dashboard" },
          { label: "Contact support", href: SUPPORT_HREF, action: "support" }
        ]
      };
  }
}

/** Security-aware member messaging for HTTP status codes. */
export function memberCopyForHttpStatus(status: number, detail?: string): MemberErrorCopy {
  if (status === 401) {
    return {
      category: "authentication",
      title: "Please sign in to continue",
      body: detail?.trim() || "Your session needs a quick refresh. Sign in again to continue.",
      nextActions: [{ label: "Sign in", href: SIGN_IN_HREF, action: "signin" }]
    };
  }
  if (status === 403) {
    return {
      category: "authentication",
      title: "Access limited",
      body:
        detail?.trim() ||
        "You don't have access to this area. If you believe this is a mistake, contact support.",
      nextActions: [
        { label: "Return to dashboard", href: DASHBOARD_HREF, action: "dashboard" },
        { label: "Contact support", href: SUPPORT_HREF, action: "support" }
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
        { label: "Contact support", href: SUPPORT_HREF, action: "support" }
      ]
    };
  }
  if (c === "ACTION_UNAVAILABLE" || c === "NOT_CONFIGURED") {
    return {
      category: "business",
      title: "Temporarily unavailable",
      body: detail?.trim() || "This feature isn't available right now. Please try again later.",
      nextActions: [
        { label: "Return to dashboard", href: DASHBOARD_HREF, action: "dashboard" },
        { label: "Contact support", href: SUPPORT_HREF, action: "support" }
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
    return "network";
  }
  if (/failed to fetch|networkerror|load failed|timeout|timed out|offline|err_network/i.test(lower)) {
    return "network";
  }
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
