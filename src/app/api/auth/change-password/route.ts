import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "@/lib/errors";
import { requireSessionUser } from "@/lib/auth/session";
import { getAuthService } from "@/lib/auth/service";

const schema = z.object({
  newPassword: z.string().min(8)
});

export async function POST(req: Request) {
  try {
    const user = await requireSessionUser();
    const body = schema.parse(await req.json());
    const auth = await getAuthService();
    await auth.changePassword(user.id, body.newPassword);
    return NextResponse.json({ ok: true, redirect: "/admin" });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
