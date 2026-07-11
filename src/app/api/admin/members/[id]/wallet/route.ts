import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleServices } from "@/lib/services";
import { requireAdmin } from "@/lib/auth/session";
import { apiErrorResponse, Errors } from "@/lib/errors";

const schema = z.object({
  action: z.enum(["fund", "debit"]),
  amount: z.number().positive(),
  note: z.string().optional()
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const { id } = await params;
    const body = schema.parse(await request.json());
    const signedAmount = body.action === "fund" ? body.amount : -body.amount;
    const result = await services.members.adjustWallet(id, signedAmount, body.note);

    await services.audit.log({
      actorId: admin.id,
      action: body.action === "fund" ? "member.wallet_funded" : "member.wallet_debited",
      entityType: "profile",
      entityId: id,
      metadata: { amount: body.amount, note: body.note, balance: result.balance }
    });

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
