import type { Metadata } from "next";

/** Shared robots directive — site must not appear in search or caches. */
export const PRIVATE_SITE_ROBOTS: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: false,
  nocache: true,
  noarchive: true,
  nosnippet: true,
  noimageindex: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
    noarchive: true,
    nosnippet: true,
    "max-video-preview": -1,
    "max-image-preview": "none",
    "max-snippet": -1
  }
};

export const X_ROBOTS_TAG =
  "noindex, nofollow, noarchive, nosnippet, noimageindex, max-image-preview:none, max-snippet:0";

/** Paths that must stay reachable for deploy/health probes (not public marketing). */
const BOT_ALLOW_PATHS = ["/api/health", "/api/health/ready", "/api/health/env", "/api/cron"];

/** Link-preview fetchers — must reach HTML/OG tags for shared URLs. */
const SOCIAL_PREVIEW_UA_SUBSTRINGS = [
  "facebookexternalhit",
  "facebot",
  "twitterbot",
  "linkedinbot",
  "telegrambot",
  "discordbot",
  "slackbot",
  "embedly",
  "pinterestbot",
  "vkshare"
];

/** Known search, SEO, and AI crawlers — blocked at the edge. */
const BLOCKED_UA_SUBSTRINGS = [
  "googlebot",
  "google-inspectiontool",
  "bingbot",
  "msnbot",
  "slurp",
  "duckduckbot",
  "baiduspider",
  "yandexbot",
  "yandeximages",
  "sogou",
  "exabot",
  "quora link preview",
  "outbrain",
  "applebot",
  "petalbot",
  "semrushbot",
  "ahrefsbot",
  "dotbot",
  "mj12bot",
  "rogerbot",
  "screaming frog",
  "ia_archiver",
  "archive.org_bot",
  "gptbot",
  "chatgpt-user",
  "claudebot",
  "anthropic-ai",
  "ccbot",
  "bytespider",
  "amazonbot",
  "meta-externalagent",
  "dataforseobot",
  "serpstatbot",
  "seznambot",
  "omgilibot",
  "hubspot",
  "w3c_validator",
  "validator.nu",
  "lighthouse",
  "pagespeed",
  "headlesschrome",
  "phantomjs",
  "selenium",
  "webdriver",
  "puppeteer",
  "playwright",
  "python-requests",
  "aiohttp",
  "httpx",
  "libwww-perl",
  "java/",
  "okhttp",
  "postman",
  "insomnia",
  "scrapy",
  "spbot",
  "blexbot",
  "megaindex",
  "zoominfobot"
];

const BLOCKED_UA_PATTERNS = [
  /\bbot\b/i,
  /\bcrawler\b/i,
  /\bspider\b/i,
  /\bscraper\b/i,
  /\bpreview\b/i
];

export function isBotAllowedPath(pathname: string) {
  return BOT_ALLOW_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function isSocialPreviewBot(userAgent: string | null | undefined) {
  const lower = (userAgent ?? "").toLowerCase();
  return SOCIAL_PREVIEW_UA_SUBSTRINGS.some((token) => lower.includes(token));
}

export function isBlockedBot(userAgent: string | null | undefined, pathname: string) {
  if (isBotAllowedPath(pathname)) return false;
  if (isSocialPreviewBot(userAgent)) return false;

  const ua = (userAgent ?? "").trim();
  if (!ua) return true;

  const lower = ua.toLowerCase();
  if (BLOCKED_UA_SUBSTRINGS.some((token) => lower.includes(token))) return true;
  if (BLOCKED_UA_PATTERNS.some((pattern) => pattern.test(ua))) return true;

  return false;
}

export function botBlockedResponse() {
  return new Response("Forbidden", {
    status: 403,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": X_ROBOTS_TAG
    }
  });
}
