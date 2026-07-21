import {
  classifyHttpStatus,
  classifyThrownError,
  memberCopyForAppCode,
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
  /** Request timeout in ms. Default 45s for slow mobile networks. */
  timeoutMs?: number;
  /** Retry count. Default 2 for GET/HEAD, 0 for others unless set. */
  retries?: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  // Do NOT hard-block on navigator.onLine — it lies on mobile (false offline,
  // captive portals, flaky LTE). Always attempt the request.
  const controller = new AbortController();
  const external = init.signal;
  const onAbort = () => controller.abort();
  if (external) {
    if (external.aborted) controller.abort();
    else external.addEventListener("abort", onAbort, { once: true });
  }

  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    const aborted =
      (error instanceof DOMException && error.name === "AbortError") ||
      (error instanceof Error && /abort/i.test(error.message));

    const trulyOffline = typeof navigator !== "undefined" && navigator.onLine === false;
    throw new ApiRequestError({
      message: memberCopyForCategory("network", aborted ? "timeout" : trulyOffline ? "offline" : undefined).body,
      status: 0,
      category: "network",
      code: aborted ? "TIMEOUT" : trulyOffline ? "OFFLINE" : "NETWORK"
    });
  } finally {
    clearTimeout(timer);
    external?.removeEventListener("abort", onAbort);
  }
}

/** Fetch JSON with timeout, retries, and classified errors. Preserves caller form state. */
export async function fetchJson<T>(url: string, init?: FetchJsonOptions): Promise<T> {
  const {
    reportServerErrors = true,
    timeoutMs = 45_000,
    retries: retriesOption,
    ...requestInit
  } = init ?? {};

  const method = (requestInit.method ?? "GET").toUpperCase();
  const retries = retriesOption ?? (method === "GET" || method === "HEAD" ? 2 : 0);
  const allowMethodRetry = method === "GET" || method === "HEAD" || retriesOption != null;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, requestInit, timeoutMs);

      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        category?: ErrorCategory;
        referenceId?: string;
        nextAction?: ErrorNextAction;
      };

      if (!response.ok) {
        const category = body.category ?? classifyHttpStatus(response.status);
        const copy = memberCopyForAppCode(body.code, body.error, response.status);
        const message = body.error?.trim() || copy.body;

        // Retry transient gateway failures when allowed.
        if (
          attempt < retries &&
          allowMethodRetry &&
          (response.status === 408 || response.status === 429 || response.status >= 502)
        ) {
          await sleep(400 * (attempt + 1) ** 2);
          continue;
        }

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
    } catch (error) {
      lastError = error;
      const retryable =
        error instanceof ApiRequestError &&
        error.category === "network" &&
        error.code !== "OFFLINE" &&
        allowMethodRetry &&
        attempt < retries;

      if (retryable) {
        await sleep(400 * (attempt + 1) ** 2);
        continue;
      }
      throw error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new ApiRequestError({
        message: memberCopyForCategory("network").body,
        status: 0,
        category: "network",
        code: "NETWORK"
      });
}

export function classifyClientFailure(error: unknown): ErrorCategory {
  if (error instanceof ApiRequestError) return error.category;
  return classifyThrownError(error);
}
