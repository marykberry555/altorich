import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { contributionTiers, makeReference } from "@/lib/domain";
import { getPublicServices, getServiceRoleServices } from "@/lib/services";
import { getSessionUser, hasAdminRole } from "@/lib/auth/session";
import { apiErrorResponse, Errors } from "@/lib/errors";
import { logger } from "@/lib/logger";

const depositSchema = z.object({
  memberName: z.string().min(2),
  phone: z.string().min(10),
  amount: z.number(),
  receiptNote: z.string().min(3),
  reference: z.string().optional(),
  proofUrl: z.string().url().optional()
});

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const isAdmin = await hasAdminRole();
    const services = isAdmin ? await getServiceRoleServices() : await getPublicServices();
    if (!services) throw Errors.notConfigured();

    const deposits = isAdmin
      ? await services.deposits.listRecent(100)
      : await services.deposits.listForUser(user.id, 100);

    return NextResponse.json(deposits);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const services = await getPublicServices();
    if (!services) throw Errors.notConfigured();

    const body = await request.json();
    const parsed = depositSchema.safeParse({
      ...body,
      amount: Number(body.amount)
    });

    if (!parsed.success) {
      throw Errors.badRequest("Invalid deposit payload.");
    }

    const { memberName, phone, amount, receiptNote, reference, proofUrl } = parsed.data;

    if (!contributionTiers.includes(amount as (typeof contributionTiers)[number])) {
      throw Errors.badRequest("Unsupported contribution tier.");
    }

    const bank = await services.settings.getBankSwitchboard();
    if (!bank.contributions_enabled) {
      return NextResponse.json(
        { error: "Contributions are temporarily disabled." },
        { status: 403 }
      );
    }

    const user = await getSessionUser();

    const deposit = await services.deposits.create({
      memberName,
      phone,
      amount,
      receiptNote,
      reference: reference ?? makeReference(phone),
      userId: user?.id,
      proofUrl
    });

    logger.info("Deposit created", { depositId: deposit.id, userId: user?.id ?? null });
    return NextResponse.json(deposit, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
