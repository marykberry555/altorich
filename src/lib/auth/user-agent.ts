export type ParsedUserAgent = {
  deviceType: "mobile" | "tablet" | "desktop" | "unknown";
  browser: string;
  operatingSystem: string;
};

export function parseUserAgent(userAgent: string): ParsedUserAgent {
  const ua = userAgent || "Unknown";

  let deviceType: ParsedUserAgent["deviceType"] = "unknown";
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) deviceType = "tablet";
  else if (/Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) deviceType = "mobile";
  else if (ua.length > 0) deviceType = "desktop";

  let browser = "Unknown";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Opera|OPR\//i.test(ua)) browser = "Opera";

  let operatingSystem = "Unknown";
  if (/Windows NT/i.test(ua)) operatingSystem = "Windows";
  else if (/Mac OS X|Macintosh/i.test(ua)) operatingSystem = "macOS";
  else if (/Android/i.test(ua)) operatingSystem = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) operatingSystem = "iOS";
  else if (/Linux/i.test(ua)) operatingSystem = "Linux";

  return { deviceType, browser, operatingSystem };
}

export type LoginGeoHint = {
  city?: string;
  country?: string;
};

/** Best-effort geo from CDN / proxy headers — no GPS required. */
export function geoFromRequestHeaders(headers: Headers): LoginGeoHint {
  const city =
    headers.get("cf-ipcity") ??
    headers.get("x-vercel-ip-city") ??
    headers.get("x-appengine-city") ??
    undefined;
  const country =
    headers.get("cf-ipcountry") ??
    headers.get("x-vercel-ip-country") ??
    headers.get("x-appengine-country") ??
    undefined;

  return {
    city: city?.trim() || undefined,
    country: country?.trim() || undefined
  };
}

export function clientIpFromHeaders(headers: Headers): string | undefined {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim();
  return headers.get("x-real-ip") ?? headers.get("cf-connecting-ip") ?? undefined;
}
