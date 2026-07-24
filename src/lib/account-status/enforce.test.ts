import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertCanDeposit,
  assertCanLogin,
  assertCanTransact,
  filterActiveUserIds
} from "./enforce";

function mockSupabase(statusById: Record<string, string>) {
  return {
    from() {
      return {
        select() {
          return {
            eq(_col: string, id: string) {
              return {
                maybeSingle: async () => ({
                  data: { account_status: statusById[id] ?? "active" },
                  error: null
                })
              };
            },
            in(_col: string, ids: string[]) {
              return Promise.resolve({
                data: ids.map((id) => ({ id, account_status: statusById[id] ?? "active" })),
                error: null
              });
            }
          };
        }
      };
    }
  };
}

describe("account status enforce", () => {
  it("allows paused login and deposit; rejects paused invest/withdraw", async () => {
    const supabase = mockSupabase({ u1: "paused" }) as never;
    await assert.doesNotReject(() => assertCanLogin(supabase, "u1"));
    await assert.doesNotReject(() => assertCanDeposit(supabase, "u1"));
    await assert.rejects(() => assertCanTransact(supabase, "u1"), /temporarily under review/i);
  });

  it("rejects blocked login and deposits", async () => {
    const supabase = mockSupabase({ u1: "blocked" }) as never;
    await assert.rejects(() => assertCanLogin(supabase, "u1"), /blocked/i);
    await assert.rejects(() => assertCanDeposit(supabase, "u1"), /blocked/i);
  });

  it("maps legacy disabled to blocked enforcement", async () => {
    const supabase = mockSupabase({ u1: "disabled" }) as never;
    await assert.rejects(() => assertCanLogin(supabase, "u1"), /blocked/i);
  });

  it("filterActiveUserIds keeps only active", async () => {
    const supabase = mockSupabase({
      a: "active",
      p: "paused",
      b: "blocked",
      d: "disabled"
    }) as never;
    const active = await filterActiveUserIds(supabase, ["a", "p", "b", "d"]);
    assert.deepEqual([...active], ["a"]);
  });
});
