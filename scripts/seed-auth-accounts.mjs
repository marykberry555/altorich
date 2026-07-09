/**
 * Seed admin + demo accounts for AltoRich auth flows.
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in env.
 *
 * Admin: ops@altorich.com / GETrich$323 (must change password on first login)
 * Demo:  demo@altorich.com / username: demouser / pin: 123456
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes, scryptSync } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

function hashPin(pin) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(pin, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

async function findUserByEmail(email) {
  const normalized = email.toLowerCase();
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === normalized) ?? null;
}

async function upsertUser({ email, password, metadata, adminRole }) {
  const existingUser = await findUserByEmail(email);
  let userId = existingUser?.id;

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Created user ${email}`);
  } else {
    await supabase.auth.admin.updateUserById(userId, {
      password,
      user_metadata: metadata,
      email_confirm: true
    });
    console.log(`Updated user ${email}`);
  }

  await supabase
    .from("profiles")
    .update({
      username: metadata.username,
      full_name: metadata.full_name,
      phone: metadata.phone,
      pin_hash: metadata.pin_hash,
      must_change_pin: metadata.must_change_pin ?? false,
      must_change_password: metadata.must_change_password ?? false,
      email_verified_at: new Date().toISOString()
    })
    .eq("id", userId);

  if (adminRole) {
    await supabase.from("admin_roles").upsert({ user_id: userId, role: adminRole }, { onConflict: "user_id,role" });
  }

  return userId;
}

async function seedDemoWallet(userId) {
  const { data: wallet } = await supabase.from("wallets").select("id").eq("user_id", userId).maybeSingle();
  if (!wallet) return;

  const ref = `SEED-DEMO-${Date.now()}`;
  const { count } = await supabase.from("wallet_transactions").select("*", { count: "exact", head: true }).eq("reference", ref);
  if (count && count > 0) return;

  await supabase.from("wallet_transactions").insert({
    wallet_id: wallet.id,
    type: "credit",
    amount: 250000,
    reference: ref,
    reason: "deposit",
    status: "completed",
    metadata: { seed: true, note: "Demo wallet balance" }
  });

  const { data: tier } = await supabase.from("roi_tiers").select("id").eq("name", "Alto Growth").maybeSingle();
  if (tier) {
    const { data: existing } = await supabase
      .from("roi_investments")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();
    if (!existing) {
      const ends = new Date();
      ends.setDate(ends.getDate() + 7);
      await supabase.from("roi_investments").insert({
        user_id: userId,
        tier_id: tier.id,
        principal_ngn: 150000,
        currency: "ngn",
        payout_method: "bank",
        status: "active",
        cycle_started_at: new Date().toISOString(),
        cycle_ends_at: ends.toISOString(),
        accrued_ngn: 0
      });
    }
  }
}

async function main() {
  const adminPassword = "GETrich$323";
  const demoPin = "123456";
  const demoPinHash = hashPin(demoPin);

  const adminId = await upsertUser({
    email: "ops@altorich.com",
    password: adminPassword,
    metadata: {
      full_name: "AltoRich Operations",
      username: "altorich_ops",
      phone: "08000000001",
      must_change_password: true,
      must_change_pin: false
    },
    adminRole: "super_admin"
  });

  const demoId = await upsertUser({
    email: "demo@altorich.com",
    password: randomBytes(24).toString("hex"),
    metadata: {
      full_name: "Demo Member",
      username: "demouser",
      phone: "08012345678",
      pin_hash: demoPinHash,
      must_change_pin: false,
      must_change_password: false
    },
    adminRole: null
  });

  await seedDemoWallet(demoId);

  console.log("\nSeed complete:");
  console.log("Admin → ops@altorich.com / GETrich$323 (change password on first login)");
  console.log("Demo  → username: demouser / pin: 123456");
  console.log(`Admin id: ${adminId}`);
  console.log(`Demo id: ${demoId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
