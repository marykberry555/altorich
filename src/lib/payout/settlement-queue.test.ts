import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  batchNumberForPosition,
  estimateSettlementProcessingAt,
  mergeSettlementQueueConfig,
  settlementWindowStart
} from "@/lib/payout/settlement-queue";

function wat(y: number, m: number, d: number, h: number, min = 0) {
  return new Date(Date.UTC(y, m - 1, d, h - 1, min, 0));
}

describe("settlement queue ETA", () => {
  const config = mergeSettlementQueueConfig({ batch_size: 10, batch_interval_minutes: 10 });

  it("assigns batch 1 to positions 1-10", () => {
    assert.equal(batchNumberForPosition(1, 10), 1);
    assert.equal(batchNumberForPosition(10, 10), 1);
    assert.equal(batchNumberForPosition(11, 10), 2);
    assert.equal(batchNumberForPosition(12, 10), 2);
  });

  it("estimates position 12 for Monday 09:00 open as ~09:10", () => {
    const mondayOpen = wat(2026, 7, 20, 9, 0);
    const eta = estimateSettlementProcessingAt({
      queuePosition: 12,
      config,
      now: mondayOpen
    });
    // Batch 2 → 09:10 WAT = 08:10 UTC
    assert.equal(eta.toISOString(), wat(2026, 7, 20, 9, 10).toISOString());
  });

  it("estimates position 1 at settlement open as 09:00", () => {
    const mondayOpen = wat(2026, 7, 20, 9, 0);
    const eta = estimateSettlementProcessingAt({
      queuePosition: 1,
      config,
      now: mondayOpen
    });
    assert.equal(eta.toISOString(), mondayOpen.toISOString());
  });

  it("uses next Monday 09:00 as window start on Saturday", () => {
    const saturday = wat(2026, 7, 18, 12, 0);
    const start = settlementWindowStart(saturday);
    assert.equal(start.toISOString(), wat(2026, 7, 20, 9, 0).toISOString());
  });

  it("respects configurable batch size", () => {
    const mondayOpen = wat(2026, 7, 20, 9, 0);
    const custom = mergeSettlementQueueConfig({ batch_size: 5, batch_interval_minutes: 10 });
    const eta = estimateSettlementProcessingAt({
      queuePosition: 12,
      config: custom,
      now: mondayOpen
    });
    // ceil(12/5)=3 → batch 3 → 09:20
    assert.equal(eta.toISOString(), wat(2026, 7, 20, 9, 20).toISOString());
  });

  it("defaults batch size to 25", () => {
    const cfg = mergeSettlementQueueConfig({});
    assert.equal(cfg.batch_size, 25);
    assert.equal(cfg.batch_interval_minutes, 10);
    assert.equal(cfg.max_daily_processing_limit, null);
  });
});
