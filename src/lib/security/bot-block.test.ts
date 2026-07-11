import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isBlockedBot, isBotAllowedPath, isSocialPreviewBot } from "./bot-block";

describe("isBlockedBot", () => {
  it("blocks major search crawlers", () => {
    assert.equal(isBlockedBot("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", "/"), true);
    assert.equal(isBlockedBot("Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)", "/"), true);
  });

  it("allows social link preview crawlers", () => {
    assert.equal(isSocialPreviewBot("facebookexternalhit/1.1"), true);
    assert.equal(isBlockedBot("facebookexternalhit/1.1", "/"), false);
    assert.equal(isBlockedBot("Twitterbot/1.0", "/"), false);
    assert.equal(isBlockedBot("LinkedInBot/1.0", "/"), false);
  });

  it("allows normal browsers", () => {
    const chrome =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    assert.equal(isBlockedBot(chrome, "/"), false);
  });

  it("allows health probes", () => {
    assert.equal(isBlockedBot("", "/api/health"), false);
    assert.equal(isBotAllowedPath("/api/health"), true);
  });

  it("blocks empty user agents on public pages", () => {
    assert.equal(isBlockedBot("", "/"), true);
  });
});
