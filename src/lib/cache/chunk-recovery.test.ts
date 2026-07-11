import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isChunkLoadFailure } from "./chunk-recovery";

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
