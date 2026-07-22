import { NextResponse } from "next/server";
import { RATE_LIMITS, type RateLimitKey } from "@/lib/security/rate-limit-config";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit = 60, windowMs = 60_000): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true };
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Apply a named configured rate limit; returns a JSON 429 response when exceeded. */
export function enforceRateLimit(
  request: Request,
  name: RateLimitKey,
  scopeKey?: string
): NextResponse | null {
  const config = RATE_LIMITS[name];
  const ip = clientIp(request);
  const key = scopeKey ? `${name}:${scopeKey}:${ip}` : `${name}:${ip}`;
  const result = rateLimit(key, config.limit, config.windowMs);
  if (result.ok) return null;
  return NextResponse.json(
    {
      error: config.message,
      code: "RATE_LIMITED",
      category: "validation"
    },
    { status: 429, headers: { "Retry-After": String(result.retryAfter ?? 60) } }
  );
}
