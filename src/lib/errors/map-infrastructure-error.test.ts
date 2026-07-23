import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapInfrastructureError } from "./map-infrastructure-error";
import { AppError } from "@/lib/errors";

describe("mapInfrastructureError", () => {
  it("maps invalid uuid (22P02) to DATA_INTEGRITY AppError", () => {
    const mapped = mapInfrastructureError({
      message: 'invalid input syntax for type uuid: "payment_rails"',
      code: "22P02"
    });
    assert.ok(mapped instanceof AppError);
    assert.equal(mapped?.code, "DATA_INTEGRITY");
    assert.equal(mapped?.status, 500);
    assert.match(mapped?.userMessage ?? "", /data integrity/i);
  });

  it("maps unique violation to CONFLICT", () => {
    const mapped = mapInfrastructureError({
      message: "duplicate key value violates unique constraint",
      code: "23505"
    });
    assert.equal(mapped?.code, "CONFLICT");
    assert.equal(mapped?.status, 409);
  });

  it("maps PGRST116 to NOT_FOUND", () => {
    const mapped = mapInfrastructureError({
      message: "JSON object requested, multiple (or no) rows returned",
      code: "PGRST116"
    });
    assert.equal(mapped?.code, "NOT_FOUND");
    assert.equal(mapped?.status, 404);
  });

  it("leaves AppError alone", () => {
    const err = new AppError("x", 400, "BAD_REQUEST");
    assert.equal(mapInfrastructureError(err), null);
  });

  it("returns null for unknown errors", () => {
    assert.equal(mapInfrastructureError(new Error("boom")), null);
  });
});
