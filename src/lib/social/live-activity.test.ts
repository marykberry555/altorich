import test from "node:test";
import assert from "node:assert/strict";
import { isAppRoute, isLiveActivityPath, isMarketingRoute } from "@/lib/route-zones";
import {
  activityActionLabel,
  firstNameOnly,
  formatActivityNaira,
  formatRelativeTime
} from "@/lib/social/live-activity-format";
import { pickNextActivity } from "@/lib/social/live-activity-provider";
import type { LiveActivity } from "@/lib/social/live-activity-types";

test("formatActivityNaira uses whole Nigerian amounts", () => {
  assert.equal(formatActivityNaira(50_000), "₦50,000");
  assert.equal(formatActivityNaira(1_500_000), "₦1,500,000");
  assert.equal(formatActivityNaira(250_000.7), "₦250,001");
});

test("firstNameOnly never exposes surname", () => {
  assert.equal(firstNameOnly("Fatima Bello"), "Fatima");
  assert.equal(firstNameOnly("  olukoye  ADE "), "Olukoye");
  assert.equal(firstNameOnly(""), "Member");
});

test("activityActionLabel covers core types", () => {
  const base = {
    id: "1",
    firstName: "Ada",
    city: "Lekki",
    occurredAt: new Date().toISOString(),
    source: "fallback" as const
  };
  assert.equal(activityActionLabel({ ...base, type: "joined" }), "Joined Alto Rich");
  assert.equal(
    activityActionLabel({ ...base, type: "invested", amountLabel: "₦50,000" }),
    "Invested ₦50,000"
  );
  assert.equal(
    activityActionLabel({ ...base, type: "payout", amountLabel: "₦500,000" }),
    "Received ₦500,000 payout"
  );
  assert.equal(
    activityActionLabel({ ...base, type: "reinvested", amountLabel: "₦250,000" }),
    "Reinvested ₦250,000"
  );
});

test("formatRelativeTime is human readable", () => {
  const now = Date.parse("2026-07-17T12:00:00.000Z");
  assert.equal(formatRelativeTime("2026-07-17T11:59:00.000Z", now), "1 minute ago");
  assert.equal(formatRelativeTime("2026-07-17T07:00:00.000Z", now), "5 hours ago");
});

test("route zones hide auth member and admin surfaces", () => {
  for (const path of [
    "/dashboard",
    "/wallet",
    "/investments",
    "/auth/login",
    "/login",
    "/signup",
    "/admin/auth",
    "/admin-app",
    "/hard/deposits",
    "/verify-email"
  ]) {
    assert.equal(isAppRoute(path), true, path);
    assert.equal(isLiveActivityPath(path), false, path);
  }

  for (const path of ["/", "/packages", "/about", "/contact", "/download", "/learn/faq"]) {
    assert.equal(isMarketingRoute(path), true, path);
    assert.equal(isLiveActivityPath(path), true, path);
  }
});

test("pickNextActivity never returns seen ids", () => {
  const pool: LiveActivity[] = [
    {
      id: "a",
      type: "joined",
      firstName: "A",
      city: "Lekki",
      occurredAt: new Date().toISOString(),
      source: "fallback"
    },
    {
      id: "b",
      type: "joined",
      firstName: "B",
      city: "Aba",
      occurredAt: new Date().toISOString(),
      source: "fallback"
    }
  ];
  const next = pickNextActivity(pool, new Set(["a", "b"]));
  assert.equal(next, null);
  const one = pickNextActivity(pool, new Set(["a"]));
  assert.equal(one?.id, "b");
});
