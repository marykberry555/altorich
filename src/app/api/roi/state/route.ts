import { NextResponse } from "next/server";
import { getUserServices } from "@/lib/services";
import { requireSessionUser } from "@/lib/auth/session";
import { getPublicEnv } from "@/lib/env";
import { Errors } from "@/lib/errors";
import { withApiHandler } from "@/lib/api/route-handler";

export const GET = withApiHandler(async () => {
  const env = getPublicEnv();
  if (!env.NEXT_PUBLIC_ROI_MODE_ENABLED) {
    return NextResponse.json({ error: "ROI mode disabled" }, { status: 404 });
  }

  const user = await requireSessionUser();
  const services = await getUserServices();
  if (!services) throw Errors.notConfigured();

  const state = await services.roi.getState(user.id);
  return NextResponse.json(state);
}, "/api/roi/state");
