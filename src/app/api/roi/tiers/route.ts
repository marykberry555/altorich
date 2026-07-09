import { NextResponse } from "next/server";
import { getPublicServices } from "@/lib/services";
import { getPublicEnv } from "@/lib/env";

export async function GET() {
  const env = getPublicEnv();
  if (!env.NEXT_PUBLIC_ROI_MODE_ENABLED) {
    return NextResponse.json({ error: "ROI mode disabled" }, { status: 404 });
  }

  const services = await getPublicServices();
  if (!services) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const tiers = await services.roi.listTiers();
  return NextResponse.json({ tiers });
}

