import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth/session";
import { getServiceRoleServices } from "@/lib/services";

const accountSchema = z.object({
  bankName: z.string().min(2),
  accountName: z.string().min(2),
  accountNumber: z.string().min(6),
  sortCode: z.string().optional(),
  displayName: z.string().optional(),
  fundingInstructions: z.string().optional(),
  displayOrder: z.number().int().min(0).optional(),
  status: z.enum(["active", "inactive", "maintenance"]).optional(),
  isPreferred: z.boolean().optional()
});

export async function GET() {
  try {
    await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw new Error("Service unavailable");

    const accounts = await services.fundingAccounts.listAll();
    return NextResponse.json({ accounts });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw new Error("Service unavailable");

    const body = accountSchema.parse(await req.json());
    const account = await services.fundingAccounts.create(body);

    await services.audit.log({
      actorId: admin.id,
      action: "funding_account.created",
      entityType: "funding_account",
      entityId: account.id,
      metadata: { bankName: account.bank_name }
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
