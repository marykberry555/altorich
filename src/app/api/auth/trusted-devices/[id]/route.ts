import { NextResponse } from "next/server";
import { getAuthService } from "@/lib/auth/service";
import { getSessionUser } from "@/lib/auth/session";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { Errors } from "@/lib/errors";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) throw Errors.unauthorized();
    const { id } = await params;
    if (!id) throw Errors.badRequest("Device id required.");
    const auth = await getAuthService();
    await auth.revokeTrustedDevice(user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
