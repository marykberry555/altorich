import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolvePostLoginRedirect } from "./post-login-redirect";

describe("resolvePostLoginRedirect", () => {
  it("sends admins to the admin-app portal by default", () => {
    assert.equal(
      resolvePostLoginRedirect({
        isAdmin: true,
        mustChangePin: false,
        mustChangePassword: false
      }),
      "/admin-app"
    );
  });

  it("honors ops intent for /hard", () => {
    assert.equal(
      resolvePostLoginRedirect({
        isAdmin: true,
        mustChangePin: false,
        mustChangePassword: false,
        intent: "ops"
      }),
      "/hard"
    );
  });

  it("sends members to dashboard", () => {
    assert.equal(
      resolvePostLoginRedirect({
        isAdmin: false,
        mustChangePin: false,
        mustChangePassword: false
      }),
      "/dashboard"
    );
  });
});
