import {
  classifyHttpStatus,
  classifyThrownError,
  memberCopyForCategory,
  type ErrorCategory,
  type ErrorNextAction
} from "@/lib/errors/taxonomy";

export type ApiClientError = {
  message: string;
  status: number;
  code?: string;
  category: ErrorCategory;
  referenceId?: string;
  nextAction?: ErrorNextAction;
};

export class ApiRequestError extends Error {
  status: number;
  code?: string;
  category: ErrorCategory;
  referenceId?: string;
  nextAction?: ErrorNextAction;

  constructor(input: ApiClientError) {
    super(input.message);
    this.name = "ApiRequestError";
    this.status = input.status;
    this.code = input.code;
    this.category = input.category;
    this.referenceId = input.referenceId;
    this.nextAction = input.nextAction;
  }
}

export function formatMemberApiError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    const base = error.message;
    if (error.referenceId) return `${base} (Reference ID: ${error.referenceId})`;
    return base;
  }
  if (error instanceof TypeError || (error instanceof Error && /fetch|network|offline/i.test(error.message))) {
    return memberCopyForCategory("network").body;
  }
  if (error instanceof Error && error.message) return error.message;
  return memberCopyForCategory("server").body;
}

function reportServerFailure(url: string, status: number, message: string) {
  if (typeof window === "undefined") return;
  const reporter = (window as Window & { __altorichReportError?: (payload: Record<string, unknown>) => void })
    .__altorichReportError;
  reporter?.({
    kind: "api-failure",
    message,
    url,
    status,
    route: window.location.pathname
  });
}

type FetchJsonOptions = RequestInit & {
  reportServerErrors?: boolean;
};

/** Fetch JSON with classified errors. Does not clear form state — callers keep their inputs. */
export async function fetchJson<T>(url: string, init?: FetchJsonOptions): Promise<T> {
  const { reportServerErrors = true, ...requestInit } = init ?? {};

  let response: Response;
  try {
    response = await fetch(url, requestInit);
  } catch {
    throw new ApiRequestError({
      message: memberCopyForCategory("network").body,
      status: 0,
      category: "network",
      code: "NETWORK"
    });
  }

  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
    category?: ErrorCategory;
    referenceId?: string;
    nextAction?: ErrorNextAction;
  };

  if (!response.ok) {
    const category = body.category ?? classifyHttpStatus(response.status);
    const message = body.error?.trim() || memberCopyForCategory(category).body;

    if (reportServerErrors && (response.status >= 500 || category === "server")) {
      reportServerFailure(url, response.status, message);
    }

    throw new ApiRequestError({
      message,
      status: response.status,
      code: body.code,
      category,
      referenceId: body.referenceId,
      nextAction: body.nextAction
    });
  }

  return body as T;
}

export function classifyClientFailure(error: unknown): ErrorCategory {
  if (error instanceof ApiRequestError) return error.category;
  return classifyThrownError(error);
}
