import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      route?: string;
      component?: string;
      message?: string;
      digest?: string;
      stack?: string;
    };

    const user = await getSessionUser().catch(() => null);

    logger.error("Client route error report", {
      route: body.route,
      component: body.component,
      userId: user?.id,
      digest: body.digest,
      message: body.message,
      stack: body.stack
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("Failed to record client error report", {
      message: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
