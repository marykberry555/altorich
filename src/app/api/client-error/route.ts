import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { persistApplicationError } from "@/lib/observability/error-log";
import { classifyThrownError, type ErrorCategory } from "@/lib/errors/taxonomy";

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
  category?: ErrorCategory;
  action?: string;
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
    const message = body.message?.trim() || "Client-reported error";
    const category = body.category ?? classifyThrownError(new Error(message));

    const browser = body.device?.userAgent
      ? body.device.userAgent.slice(0, 200)
      : undefined;
    const device = body.device
      ? [body.device.platform, body.device.viewport, body.device.online === false ? "offline" : "online"]
          .filter(Boolean)
          .join(" · ")
      : undefined;

    const persisted = await persistApplicationError({
      category,
      message,
      code: body.kind ?? "CLIENT",
      userId: user?.id,
      route: body.route ?? body.url,
      action: body.action ?? body.component,
      requestId: body.digest,
      correlationId: body.digest,
      browser,
      device,
      userAgent: body.device?.userAgent,
      stack: body.stack,
      metadata: {
        kind: body.kind,
        status: body.status,
        at: body.at,
        language: body.device?.language,
        standalone: body.device?.standalone,
        online: body.device?.online
      }
    });

    return NextResponse.json({ ok: true, referenceId: persisted.referenceId });
  } catch (error) {
    const persisted = await persistApplicationError({
      category: "server",
      message: error instanceof Error ? error.message : String(error),
      code: "CLIENT_ERROR_INGEST",
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ ok: false, referenceId: persisted.referenceId }, { status: 500 });
  }
}
