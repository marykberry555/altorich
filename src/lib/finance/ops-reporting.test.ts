import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseBankCsv } from "@/services/admin/bank-reconciliation.service";
import { lagosDayBounds, lagosWeekBounds } from "@/lib/finance/lagos-window";

describe("parseBankCsv", () => {
  it("parses flexible headers and amounts", () => {
    const csv = `Date,Narration,Account Number,Amount
2026-07-20,ALT-20260720-000001,0123456789,"1,500.00"
20/07/2026,Salary credit,999,"2,000"`;
    const rows = parseBankCsv(csv);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].amount, 1500);
    assert.ok(rows[0].reference?.includes("ALT-20260720"));
    assert.equal(rows[0].account_number, "0123456789");
    assert.equal(rows[0].date, "2026-07-20");
    assert.equal(rows[1].date, "2026-07-20");
  });
});

describe("lagos window", () => {
  it("builds inclusive day bounds in WAT", () => {
    const b = lagosDayBounds("2026-07-20");
    assert.equal(b.dayKey, "2026-07-20");
    assert.ok(new Date(b.endIso).getTime() > new Date(b.startIso).getTime());
  });

  it("weeks start Monday", () => {
    const w = lagosWeekBounds("2026-07-17"); // Friday
    assert.equal(w.weekStartKey, "2026-07-13");
    assert.equal(w.weekEndKey, "2026-07-19");
  });
});
