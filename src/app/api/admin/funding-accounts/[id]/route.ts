import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth/session";
import { getServiceRoleServices } from "@/lib/services";
import { accountNumberSchema } from "@/lib/validation/schemas";

const accountSchema = z.object({
  bankName: z.string().min(2).optional(),
  accountName: z.string().min(2).optional(),
  accountNumber: accountNumberSchema.optional(),
  sortCode: z.string().nullable().optional(),
  displayName: z.string().nullable().optional(),
  fundingInstructions: z.string().nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
  status: z.enum(["active", "inactive", "maintenance"]).optional(),
  isPreferred: z.boolean().optional()
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const services = await getServiceRoleServices();
    if (!services) throw new Error("Service unavailable");

    const body = accountSchema.parse(await req.json());
    const account = await services.fundingAccounts.update(id, body);

    await services.audit.log({
      actorId: admin.id,
      action: "funding_account.updated",
      entityType: "funding_account",
      entityId: account.id,
      metadata: body
    });

    return NextResponse.json({ account });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const services = await getServiceRoleServices();
    if (!services) throw new Error("Service unavailable");

    await services.fundingAccounts.delete(id);

    await services.audit.log({
      actorId: admin.id,
      action: "funding_account.deleted",
      entityType: "funding_account",
      entityId: id
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
