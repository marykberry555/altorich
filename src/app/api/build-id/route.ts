import { NextResponse } from "next/server";
import { getBuildId } from "@/lib/build-id";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { buildId: getBuildId() },
    {
      headers: {
        "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
        "CDN-Cache-Control": "no-store"
      }
    }
  );
}
