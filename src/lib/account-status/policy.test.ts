import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canAccessMemberApp,
  canDeposit,
  canLogin,
  canTransact,
  isEligibleForAutomatedFinance,
  loginBlockedMessage,
  mustRevokeSessions,
  normalizeAccountStatus,
  PAUSED_BANNER_MESSAGE
} from "./policy";

describe("account status policy (active/paused/blocked)", () => {
  it("allows active users full access", () => {
    assert.equal(canLogin("active"), true);
    assert.equal(canAccessMemberApp("active"), true);
    assert.equal(canDeposit("active"), true);
    assert.equal(canTransact("active"), true);
    assert.equal(isEligibleForAutomatedFinance("active"), true);
    assert.equal(mustRevokeSessions("active"), false);
  });

  it("paused is a review state: login + deposit OK; invest/withdraw/earn blocked", () => {
    assert.equal(canLogin("paused"), true);
    assert.equal(canAccessMemberApp("paused"), true);
    assert.equal(canDeposit("paused"), true);
    assert.equal(canTransact("paused"), false);
    assert.equal(isEligibleForAutomatedFinance("paused"), false);
    assert.equal(mustRevokeSessions("paused"), false);
    assert.equal(PAUSED_BANNER_MESSAGE, "Your account is temporarily under review.");
  });

  it("blocked denies login and revokes sessions", () => {
    assert.equal(canLogin("blocked"), false);
    assert.equal(canAccessMemberApp("blocked"), false);
    assert.equal(canDeposit("blocked"), false);
    assert.equal(canTransact("blocked"), false);
    assert.equal(isEligibleForAutomatedFinance("blocked"), false);
    assert.equal(mustRevokeSessions("blocked"), true);
    assert.ok(loginBlockedMessage("blocked").toLowerCase().includes("blocked"));
  });

  it("normalizes legacy statuses to blocked", () => {
    assert.equal(normalizeAccountStatus("suspended"), "blocked");
    assert.equal(normalizeAccountStatus("disabled"), "blocked");
    assert.equal(normalizeAccountStatus("deactivated"), "blocked");
    assert.equal(normalizeAccountStatus("BLOCKED"), "blocked");
    assert.equal(normalizeAccountStatus("active"), "active");
    assert.equal(normalizeAccountStatus(null), "active");
  });
});
