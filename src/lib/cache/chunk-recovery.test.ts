import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isChunkLoadFailure, safeRecoveryHref, LONG_BACKGROUND_MS } from "./chunk-recovery";

describe("isChunkLoadFailure", () => {
  it("detects webpack chunk load errors", () => {
    assert.equal(isChunkLoadFailure("Loading chunk 6814 failed."), true);
    assert.equal(isChunkLoadFailure("ChunkLoadError: something"), true);
    assert.equal(isChunkLoadFailure("Failed to fetch dynamically imported module"), true);
  });

  it("ignores unrelated errors", () => {
    assert.equal(isChunkLoadFailure("Network request failed"), false);
    assert.equal(isChunkLoadFailure("Invalid credentials"), false);
  });
});

describe("safeRecoveryHref", () => {
  it("reloads member app routes in place after recovery", () => {
    assert.equal(safeRecoveryHref("/wallet"), "/wallet");
    assert.equal(safeRecoveryHref("/deposits/123"), "/deposits/123");
    assert.equal(safeRecoveryHref("/profile"), "/profile");
  });

  it("keeps auth and admin routes on their current path", () => {
    assert.equal(safeRecoveryHref("/auth/login"), "/auth/login");
    assert.equal(safeRecoveryHref("/admin-app/deposits"), "/admin-app/deposits");
    assert.equal(safeRecoveryHref("/hard/ops"), "/hard/ops");
  });

  it("defaults marketing failures to home", () => {
    assert.equal(safeRecoveryHref("/about"), "/");
  });
});

describe("LONG_BACKGROUND_MS", () => {
  it("is at least thirty minutes", () => {
    assert.ok(LONG_BACKGROUND_MS >= 30 * 60 * 1000);
  });
});
