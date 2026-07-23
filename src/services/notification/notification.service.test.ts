import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NotificationService } from "@/services/notification/notification.service";

describe("NotificationService fail-soft", () => {
  it("notifyEvent does not throw when in-app insert fails", async () => {
    const supabase = {
      from() {
        return {
          insert: async () => ({
            error: { message: "insert failed", code: "23505" }
          })
        };
      },
      auth: {
        admin: {
          getUserById: async () => ({ data: { user: null }, error: null })
        }
      }
    };

    const notifications = new NotificationService(supabase as never);
    await assert.doesNotReject(() =>
      notifications.notifyEvent("deposit.approved", "511d886d-a998-419b-9efa-1ee5f0982254", {
        amount: 1000
      })
    );
  });

  it("dispatch does not throw on insert failure", async () => {
    const supabase = {
      from() {
        return {
          insert: async () => ({
            error: { message: "boom", code: "XX000" }
          })
        };
      }
    };

    const notifications = new NotificationService(supabase as never);
    await assert.doesNotReject(() =>
      notifications.dispatch({
        userId: "511d886d-a998-419b-9efa-1ee5f0982254",
        title: "t",
        body: "b"
      })
    );
  });
});
