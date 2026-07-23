import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mergePaymentRails,
  routeSettlementMethod,
  listActiveDepositMethods,
  applyPaymentRailsPatch
} from "./payment-rails";

describe("payment rails merge + routing", () => {
  it("defaults to bank deposit and withdrawal open, crypto closed", () => {
    const resolved = mergePaymentRails(null);
    assert.equal(resolved.bankDepositOpen, true);
    assert.equal(resolved.bankWithdrawalOpen, true);
    assert.equal(resolved.cryptoDepositOpen, false);
    assert.equal(resolved.cryptoWithdrawalOpen, false);
    assert.deepEqual(listActiveDepositMethods(resolved), ["bank"]);
  });

  it("honours live crypto deposit enable", () => {
    const resolved = mergePaymentRails({
      rails: { crypto: { deposit: { enabled: true } } }
    });
    assert.equal(resolved.cryptoDepositOpen, true);
    assert.deepEqual(listActiveDepositMethods(resolved).sort(), ["bank", "crypto"]);
  });

  it("routes settlement to crypto when bank withdrawal off", () => {
    const resolved = mergePaymentRails({
      rails: {
        bank: { withdrawal: { enabled: false } },
        crypto: { withdrawal: { enabled: true } }
      }
    });
    const route = routeSettlementMethod(resolved, "bank");
    assert.equal(route.method, "crypto");
  });

  it("returns null method when all withdrawals closed", () => {
    const resolved = mergePaymentRails({
      rails: {
        bank: { withdrawal: { enabled: false } },
        crypto: { withdrawal: { enabled: false } }
      }
    });
    const route = routeSettlementMethod(resolved);
    assert.equal(route.method, null);
  });

  it("applies admin patch without wiping unrelated rails", () => {
    const next = applyPaymentRailsPatch(
      { rails: { bank: { deposit: { enabled: true } } } },
      { rails: { crypto: { deposit: { enabled: true } } } }
    );
    assert.equal(next.rails?.bank?.deposit?.enabled, true);
    assert.equal(next.rails?.crypto?.deposit?.enabled, true);
  });

  it("keeps legacy addresses when live platformAddresses is an empty array", () => {
    const resolved = mergePaymentRails(
      { rails: { crypto: { deposit: { enabled: true } } }, platformAddresses: [] },
      undefined,
      [{ asset: "USDT", network: "TRC20", address: "TLegacyAddress123" }]
    );
    assert.equal(resolved.cryptoDepositOpen, true);
    assert.equal(resolved.platformAddresses[0]?.address, "TLegacyAddress123");
  });
});
