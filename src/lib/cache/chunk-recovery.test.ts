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
  it("soft-lands member app routes on dashboard", () => {
    assert.equal(safeRecoveryHref("/wallet"), "/dashboard");
    assert.equal(safeRecoveryHref("/deposits/123"), "/dashboard");
  });

  it("keeps auth and admin entry points stable", () => {
    assert.equal(safeRecoveryHref("/auth/login"), "/auth/login");
    assert.equal(safeRecoveryHref("/admin-app/deposits"), "/admin-app");
    assert.equal(safeRecoveryHref("/hard/ops"), "/hard");
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
