import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminService } from "@/lib/auth/session";
import { getPublicEnv } from "@/lib/env";

const schema = z.object({
  roi_exchange_rate: z
    .object({
      ngn_per_usd: z.number().positive()
    })
    .optional(),
  roi_payout_destinations: z
    .object({
      bank_enabled: z.boolean(),
      crypto_enabled: z.boolean(),
      crypto_address: z.string().optional()
    })
    .optional()
});

export async function POST(req: Request) {
  const env = getPublicEnv();
  if (!env.NEXT_PUBLIC_ROI_MODE_ENABLED) {
    return NextResponse.json({ error: "ROI mode disabled" }, { status: 404 });
  }

  const { supabase, user } = await requireAdminService();
  const body = schema.parse(await req.json());

  if (body.roi_exchange_rate) {
    await supabase.from("settings").upsert({
      key: "roi_exchange_rate",
      value: { ...body.roi_exchange_rate, updated_at: new Date().toISOString() },
      updated_by: user.id
    });
  }

  if (body.roi_payout_destinations) {
    await supabase.from("settings").upsert({
      key: "roi_payout_destinations",
      value: { ...body.roi_payout_destinations, updated_at: new Date().toISOString() },
      updated_by: user.id
    });
  }

  return NextResponse.json({ ok: true });
}

