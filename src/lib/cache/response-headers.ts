import type { NextResponse } from "next/server";

/** Prevent CDN/browser from caching HTML — stale HTML is the #1 cause of ChunkLoadError after deploy. */
export function applyDocumentNoStoreHeaders(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-cache, no-store, max-age=0, must-revalidate");
  response.headers.set("CDN-Cache-Control", "no-store");
  response.headers.set("Cloudflare-CDN-Cache-Control", "no-store");
  response.headers.set("Surrogate-Control", "no-store");
  response.headers.set("Pragma", "no-cache");
  response.headers.delete("s-maxage");
  return response;
}
