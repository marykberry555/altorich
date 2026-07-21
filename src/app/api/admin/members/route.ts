import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleServices } from "@/lib/services";
import { requireAdmin } from "@/lib/auth/session";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { phoneSchema } from "@/lib/validation/schemas";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 50);
    const search = searchParams.get("search") ?? searchParams.get("q") ?? undefined;

    const result = await services.members.listMembers(page, limit, {
      search,
      status: searchParams.get("status") ?? undefined,
      kycStatus: searchParams.get("kycStatus") ?? undefined,
      emailVerified: (searchParams.get("emailVerified") as "yes" | "no" | null) ?? undefined,
      memberId: searchParams.get("memberId") ?? undefined,
      inviteCode: searchParams.get("inviteCode") ?? undefined,
      registeredFrom: searchParams.get("registeredFrom") ?? undefined,
      registeredTo: searchParams.get("registeredTo") ?? undefined,
      locationState: searchParams.get("locationState") ?? undefined
    });
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

const createSchema = z.object({
  fullName: z.string().min(2),
  username: z.string().min(3).max(24),
  email: z.string().email(),
  phone: phoneSchema,
  pin: z.string().length(6)
});

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const body = createSchema.parse(await request.json());
    const created = await services.members.createMember(body);

    await services.audit.log({
      actorId: admin.id,
      action: "member.created",
      entityType: "profile",
      entityId: created.userId,
      metadata: { username: created.username, email: created.email }
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
