import { NextResponse } from "next/server";
import { getPublicServices } from "@/lib/services";
import { getPublicEnv } from "@/lib/env";
import { Errors } from "@/lib/errors";
import { withApiHandler } from "@/lib/api/route-handler";

export const GET = withApiHandler(async () => {
  const env = getPublicEnv();
  if (!env.NEXT_PUBLIC_ROI_MODE_ENABLED) {
    return NextResponse.json({ error: "ROI mode disabled" }, { status: 404 });
  }

  const services = await getPublicServices();
  if (!services) throw Errors.notConfigured();

  const tiers = await services.roi.listTiers();
  return NextResponse.json({ tiers });
}, "/api/roi/tiers");
