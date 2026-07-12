import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

type ClientErrorBody = {
  route?: string;
  component?: string;
  message?: string;
  digest?: string;
  stack?: string;
  kind?: string;
  status?: number;
  url?: string;
  at?: string;
  device?: {
    userAgent?: string;
    language?: string;
    platform?: string;
    standalone?: boolean;
    viewport?: string;
    online?: boolean;
  };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ClientErrorBody;
    const user = await getSessionUser().catch(() => null);

    logger.error("Client crash report", {
      kind: body.kind ?? "route-error",
      route: body.route,
      component: body.component,
      adminId: user?.id,
      message: body.message,
      digest: body.digest,
      status: body.status,
      url: body.url,
      at: body.at,
      device: body.device,
      stack: body.stack?.slice(0, 4000)
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("Failed to record client error report", {
      message: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
