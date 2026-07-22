import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getUserServices } from "@/lib/services";
import { requireSessionUser } from "@/lib/auth/session";
import { getPublicEnv } from "@/lib/env";
import { Errors } from "@/lib/errors";
import { withApiHandler } from "@/lib/api/route-handler";

const schema = z.object({
  tierId: z.string().uuid(),
  principalNgn: z.number().positive(),
  currency: z.enum(["ngn", "usdt", "btc"]).default("ngn"),
  payoutMethod: z.enum(["bank", "crypto"]).default("bank"),
  payoutDestination: z.record(z.string(), z.unknown()).default({})
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const env = getPublicEnv();
  if (!env.NEXT_PUBLIC_ROI_MODE_ENABLED) {
    return NextResponse.json({ error: "ROI mode disabled" }, { status: 404 });
  }

  const user = await requireSessionUser();
  const services = await getUserServices();
  if (!services) throw Errors.notConfigured();

  const body = schema.parse(await req.json());
  const investment = await services.roi.createInvestment({
    userId: user.id,
    tierId: body.tierId,
    principalNgn: body.principalNgn,
    currency: body.currency,
    payoutMethod: body.payoutMethod,
    payoutDestination: body.payoutDestination
  });

  return NextResponse.json({ investment });
}, "/api/roi/investments");
