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
      return {
        category,
        title: "Connection problem",
        body:
          detail?.trim() ||
          "We couldn't reach Alto Rich right now. Please check your internet connection or try again in a moment.",
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
        title: "Unexpected error",
        body:
          detail?.trim() ||
          "We're sorry — an unexpected error occurred. Our team has automatically been notified. Your request has not been processed.",
        nextActions: [
          { label: "Retry", action: "retry" },
          { label: "Dashboard", href: DASHBOARD_HREF },
          { label: "Contact Support", href: SUPPORT_HREF, action: "support" }
        ]
      };
  }
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

  if (
    /failed to fetch|networkerror|load failed|timeout|timed out|offline|err_network|chunkloaderror|loading chunk/i.test(
      lower
    )
  ) {
    return "network";
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
  if (["NOT_FOUND"].includes(c)) return "not_found";
  if (["BAD_REQUEST", "VALIDATION"].includes(c)) return "validation";
  if (["CONFLICT", "INSUFFICIENT_BALANCE", "BUSINESS_RULE"].includes(c)) return "business";
  if (["NOT_CONFIGURED", "INTERNAL", "PERMISSION_DENIED"].includes(c)) return "server";
  if (status != null) return classifyHttpStatus(status);
  return "server";
}
