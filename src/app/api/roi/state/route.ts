import { NextResponse } from "next/server";
import { getUserServices } from "@/lib/services";
import { requireSessionUser } from "@/lib/auth/session";
import { getPublicEnv } from "@/lib/env";

export async function GET() {
  const env = getPublicEnv();
  if (!env.NEXT_PUBLIC_ROI_MODE_ENABLED) {
    return NextResponse.json({ error: "ROI mode disabled" }, { status: 404 });
  }

  const user = await requireSessionUser();
  const services = await getUserServices();
  if (!services) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const state = await services.roi.getState(user.id);
  return NextResponse.json(state);
}

