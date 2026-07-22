import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  payloadContainsPinHash,
  stripSensitiveFields,
  toPublicProfile,
  PROFILE_SAFE_COLUMNS
} from "@/lib/security/profile-safe";
import { FINANCE_CAPABLE_ROLES } from "@/lib/auth/finance-roles";
import { RATE_LIMITS } from "@/lib/security/rate-limit-config";
import { safeRecoveryHref } from "@/lib/cache/chunk-recovery";

describe("pin_hash exposure guards", () => {
  it("PROFILE_SAFE_COLUMNS never includes pin_hash", () => {
    assert.equal(PROFILE_SAFE_COLUMNS.includes("pin_hash"), false);
  });

  it("toPublicProfile strips pin_hash even if present on the row", () => {
    const row = {
      id: "u1",
      username: "demo",
      full_name: "Demo User",
      pin_hash: "scrypt:salt:hash",
      phone: "08012345678",
      must_change_pin: false,
      created_at: "2026-01-01",
      updated_at: "2026-01-01"
    };
    const publicProfile = toPublicProfile(row);
    assert.ok(publicProfile);
    assert.equal("pin_hash" in publicProfile!, false);
    assert.equal(publicProfile!.username, "demo");
    assert.equal(payloadContainsPinHash(publicProfile), false);
  });

  it("stripSensitiveFields removes nested pin_hash", () => {
    const payload = {
      profile: { id: "1", pin_hash: "secret", username: "a" },
      nested: [{ pin_hash: "x", ok: true }]
    };
    const cleaned = stripSensitiveFields(payload);
    assert.equal(payloadContainsPinHash(cleaned), false);
    assert.equal((cleaned.profile as { username: string }).username, "a");
    assert.equal((cleaned.nested as { ok: boolean }[])[0].ok, true);
  });

  it("payloadContainsPinHash detects leaks", () => {
    assert.equal(payloadContainsPinHash({ pin_hash: "x" }), true);
    assert.equal(payloadContainsPinHash({ profile: { pinHash: "x" } }), true);
    assert.equal(payloadContainsPinHash({ id: "1" }), false);
  });
});

describe("financial authorization roles", () => {
  it("allows only finance-capable roles", () => {
    assert.deepEqual([...FINANCE_CAPABLE_ROLES].sort(), ["admin", "finance", "super_admin"].sort());
    assert.equal(FINANCE_CAPABLE_ROLES.includes("support" as never), false);
  });
});

describe("rate limit configuration", () => {
  it("covers auth and financial endpoints", () => {
    for (const key of [
      "authLogin",
      "authRegister",
      "authOtp",
      "depositCreate",
      "withdrawalCreate",
      "investmentCreate",
      "adminFinanceAction",
      "adminLogin",
      "profileUpdate"
    ] as const) {
      assert.ok(RATE_LIMITS[key].limit > 0);
      assert.ok(RATE_LIMITS[key].windowMs > 0);
      assert.ok(RATE_LIMITS[key].message.length > 10);
      assert.equal(/rate.?limit|bucket|redis/i.test(RATE_LIMITS[key].message), false);
    }
  });
});

describe("chunk recovery navigation", () => {
  it("preserves member routes instead of forcing dashboard", () => {
    assert.equal(safeRecoveryHref("/deposits"), "/deposits");
    assert.equal(safeRecoveryHref("/wallet"), "/wallet");
    assert.equal(safeRecoveryHref("/portfolio"), "/portfolio");
    assert.equal(safeRecoveryHref("/withdrawals"), "/withdrawals");
  });
});
