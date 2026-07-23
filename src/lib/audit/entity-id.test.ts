import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { coerceAuditEntityId, isUuid, normalizeAuditEntityId } from "./entity-id";

describe("normalizeAuditEntityId (TEXT entity_id model)", () => {
  it("keeps real UUIDs", () => {
    const id = "511d886d-a998-419b-9efa-1ee5f0982254";
    assert.equal(isUuid(id), true);
    assert.equal(normalizeAuditEntityId(id), id);
    assert.deepEqual(coerceAuditEntityId(id), { entityId: id, entityKey: null });
  });

  it("stores settings keys on entity_id (not metadata workaround)", () => {
    assert.equal(normalizeAuditEntityId("payment_rails"), "payment_rails");
    assert.equal(normalizeAuditEntityId("settlement_queue"), "settlement_queue");
    assert.equal(normalizeAuditEntityId("system"), "system");
    assert.equal(normalizeAuditEntityId("global"), "global");
    assert.deepEqual(coerceAuditEntityId("payment_rails"), {
      entityId: "payment_rails",
      entityKey: null
    });
  });

  it("treats empty as null", () => {
    assert.equal(normalizeAuditEntityId(""), null);
    assert.equal(normalizeAuditEntityId(null), null);
    assert.equal(normalizeAuditEntityId(undefined), null);
  });
});
