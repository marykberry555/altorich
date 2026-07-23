import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runSecondary } from "./run-secondary";

describe("runSecondary", () => {
  it("resolves when work succeeds", async () => {
    let ran = false;
    await runSecondary("ok", async () => {
      ran = true;
    });
    assert.equal(ran, true);
  });

  it("swallows thrown errors without rejecting", async () => {
    await assert.doesNotReject(() =>
      runSecondary("boom", async () => {
        throw new Error("secondary failed");
      })
    );
  });
});
