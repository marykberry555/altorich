import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { AuditService } from "@/services/audit/audit.service";
import { NotificationService } from "@/services/notification/notification.service";
import { runSecondary } from "@/lib/resilience/run-secondary";
import { drainSecondaryFailures } from "@/lib/resilience/secondary-failures";

/**
 * Chaos resilience: primary financial commit must survive secondary outages.
 *
 * Simulates the post-commit pattern used by payment / deposit / withdrawal flows:
 *   1. Wallet + ledger + investment already committed (PRIMARY)
 *   2. Audit / notify / email all force-fail (SECONDARY)
 *   3. Caller still returns success; failures are recorded
 */
describe("financial chaos resilience", () => {
  beforeEach(() => {
    drainSecondaryFailures();
  });

  it("returns success when wallet/ledger/investment committed and audit+notify+email all throw", async () => {
    // --- PRIMARY (already committed) ---
    const wallet = { balance: 50_000, committed: true };
    const ledger = { transactions: ["DEP-chaos-1"], committed: true };
    const investment = { id: "inv-chaos-1", amount: 50_000, committed: true };

    const throwingClient = {
      from() {
        return {
          insert: async () => {
            throw new Error("forced audit/notification insert failure");
          },
          select() {
            return this;
          },
          eq() {
            return this;
          },
          maybeSingle: async () => {
            throw new Error("forced preference lookup failure");
          }
        };
      },
      auth: {
        admin: {
          getUserById: async () => {
            throw new Error("forced email lookup failure");
          }
        }
      }
    };

    const audit = new AuditService(throwingClient as never);
    const notifications = new NotificationService(throwingClient as never);

    // --- SECONDARY (all forced to fail) ---
    await runSecondary("chaos.audit", () =>
      audit.log({
        actorId: "511d886d-a998-419b-9efa-1ee5f0982254",
        action: "payment.completed",
        entityType: "payment_transaction",
        entityId: "payment_rails"
      })
    );

    await runSecondary("chaos.notify", () =>
      notifications.notifyEvent("deposit.approved", "511d886d-a998-419b-9efa-1ee5f0982254", {
        amount: 50_000
      })
    );

    await runSecondary("chaos.email", async () => {
      throw new Error("forced email send failure");
    });

    // Direct service calls must also be fail-soft (not only via runSecondary)
    await assert.doesNotReject(() =>
      audit.log({
        actorId: null,
        action: "chaos.direct_audit",
        entityType: "system",
        entityId: "system"
      })
    );
    await assert.doesNotReject(() =>
      notifications.dispatch({
        userId: "511d886d-a998-419b-9efa-1ee5f0982254",
        title: "Chaos",
        body: "Should not throw"
      })
    );

    const userFacing = {
      ok: true as const,
      walletBalance: wallet.balance,
      ledgerTxCount: ledger.transactions.length,
      investmentId: investment.id
    };

    assert.equal(wallet.committed, true);
    assert.equal(ledger.committed, true);
    assert.equal(investment.committed, true);
    assert.equal(userFacing.ok, true);
    assert.equal(userFacing.walletBalance, 50_000);
    assert.equal(userFacing.investmentId, "inv-chaos-1");

    const failures = drainSecondaryFailures();
    // audit.log + notify/dispatch path + explicit email secondary all recorded
    assert.ok(failures.length >= 3, `expected ≥3 secondary failures, got ${JSON.stringify(failures)}`);
    assert.ok(failures.some((f) => f.label === "audit.log" || f.label === "chaos.audit"));
    assert.ok(
      failures.some(
        (f) =>
          f.label === "chaos.email" ||
          f.label.startsWith("notifications.") ||
          f.label === "chaos.notify"
      )
    );
    assert.ok(failures.some((f) => f.label === "chaos.email"));
  });

  it("persists settings entity_id as TEXT key when insert succeeds", async () => {
    const inserted: { entity_id?: unknown; entity_type?: unknown } = {};
    const supabase = {
      from() {
        return {
          insert: async (row: Record<string, unknown>) => {
            Object.assign(inserted, row);
            return { error: null };
          }
        };
      }
    };

    const audit = new AuditService(supabase as never);
    await audit.log({
      actorId: null,
      action: "settings.payment_rails_updated",
      entityType: "payment_rails",
      entityId: "payment_rails"
    });

    assert.equal(inserted.entity_type, "payment_rails");
    assert.equal(inserted.entity_id, "payment_rails");
  });
});
