import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getPublicOrigin, safeRedirectPath } from "@/lib/request-url";

function request(url: string, headers: Record<string, string> = {}) {
  return new Request(url, { headers: new Headers(headers) });
}

describe("getPublicOrigin", () => {
  it("rejects 0.0.0.0 request origin and uses configured site URL", () => {
    const prev = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://altorich.com";
    try {
      const origin = getPublicOrigin(request("http://0.0.0.0:3000/api/auth/logout"));
      assert.equal(origin, "https://altorich.com");
    } finally {
      process.env.NEXT_PUBLIC_SITE_URL = prev;
    }
  });

  it("prefers x-forwarded-host on proxy requests", () => {
    const origin = getPublicOrigin(
      request("http://0.0.0.0:3000/api/auth/logout", {
        "x-forwarded-host": "altorich.com",
        "x-forwarded-proto": "https"
      })
    );
    assert.equal(origin, "https://altorich.com");
  });

  it("uses host header when public", () => {
    const origin = getPublicOrigin(
      request("http://127.0.0.1:3000/api/auth/logout", {
        host: "altorich.com",
        "x-forwarded-proto": "https"
      })
    );
    assert.equal(origin, "https://altorich.com");
  });
});

describe("safeRedirectPath", () => {
  it("blocks open redirects", () => {
    assert.equal(safeRedirectPath("//evil.com"), "/dashboard");
    assert.equal(safeRedirectPath("https://evil.com"), "/dashboard");
  });

  it("allows internal paths", () => {
    assert.equal(safeRedirectPath("/portfolio"), "/portfolio");
  });
});
