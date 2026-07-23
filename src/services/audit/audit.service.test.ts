import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AuditService } from "@/services/audit/audit.service";

describe("AuditService.log fail-soft", () => {
  it("does not throw when insert returns a Postgres UUID error", async () => {
    const supabase = {
      from() {
        return {
          insert: async () => ({
            error: {
              message: 'invalid input syntax for type uuid: "payment_rails"',
              code: "22P02"
            }
          })
        };
      }
    };

    const audit = new AuditService(supabase as never);
    await assert.doesNotReject(() =>
      audit.log({
        actorId: "511d886d-a998-419b-9efa-1ee5f0982254",
        action: "payment_rails.updated",
        entityType: "settings",
        entityId: "payment_rails"
      })
    );
  });

  it("stores settings keys on entity_id as TEXT", async () => {
    const inserted: { entity_id?: unknown; metadata?: unknown } = {};
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
      action: "settlement_queue.updated",
      entityType: "settlement_queue",
      entityId: "settlement_queue",
      metadata: { foo: 1 }
    });

    assert.equal(inserted.entity_id, "settlement_queue");
    assert.deepEqual(inserted.metadata, { foo: 1 });
  });
});
