import { NextResponse } from "next/server";
import { getAuthService } from "@/lib/auth/service";
import { getSessionUser } from "@/lib/auth/session";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { Errors } from "@/lib/errors";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) throw Errors.unauthorized();
    const auth = await getAuthService();
    const devices = await auth.listTrustedDevices(user.id);
    return NextResponse.json({ devices });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE() {
  try {
    const user = await getSessionUser();
    if (!user) throw Errors.unauthorized();
    const auth = await getAuthService();
    await auth.revokeAllTrustedDevices(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
