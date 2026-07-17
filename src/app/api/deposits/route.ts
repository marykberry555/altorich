import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { makeReference } from "@/lib/domain";
import { MIN_FUNDING_AMOUNT_NGN } from "@/lib/payments";
import { getPublicServices, getServiceRoleServices } from "@/lib/services";
import { getSessionUser, hasAdminRole, requireSessionUser } from "@/lib/auth/session";
import { apiErrorResponse, Errors } from "@/lib/errors";
import { logger } from "@/lib/logger";

const depositSchema = z.object({
  memberName: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  amount: z.number(),
  paymentReference: z.string().min(3).optional(),
  receiptNote: z.string().min(3).optional(),
  reference: z.string().optional(),
  proofUrl: z.string().min(3).max(500).optional()
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

    const user = await requireSessionUser();

    const body = await request.json();
    const parsed = depositSchema.safeParse({
      ...body,
      amount: Number(body.amount)
    });

    if (!parsed.success) {
      throw Errors.badRequest("Invalid deposit payload.");
    }

    const profile = await services.profile.getProfile(user.id).catch(() => null);

    const memberName =
      parsed.data.memberName?.trim() ||
      profile?.full_name?.trim() ||
      user.user_metadata?.full_name?.trim() ||
      user.email?.split("@")[0] ||
      "Member";

    const phone =
      parsed.data.phone?.trim() ||
      profile?.phone?.trim() ||
      user.user_metadata?.phone?.trim() ||
      "";

    if (phone.length < 10) {
      throw Errors.badRequest("Add your phone number in Settings before funding your wallet.");
    }

    const paymentReference =
      parsed.data.paymentReference?.trim() ||
      parsed.data.reference?.trim() ||
      parsed.data.receiptNote?.trim() ||
      "";

    if (paymentReference.length < 3) {
      throw Errors.badRequest("Payment reference is required.");
    }

    const { amount, proofUrl } = parsed.data;

    if (amount < MIN_FUNDING_AMOUNT_NGN) {
      throw Errors.badRequest(`Minimum funding amount is ₦${MIN_FUNDING_AMOUNT_NGN.toLocaleString("en-NG")}.`);
    }

    const bank = await services.settings.getBankSwitchboard();
    if (!bank.contributions_enabled) {
      return NextResponse.json(
        { error: "Wallet funding is temporarily disabled." },
        { status: 403 }
      );
    }

    const deposit = await services.deposits.create({
      memberName,
      phone,
      amount,
      receiptNote: paymentReference,
      reference: paymentReference || makeReference(phone),
      userId: user.id,
      proofUrl
    });

    logger.info("Deposit created", { depositId: deposit.id, userId: user.id });
    return NextResponse.json(deposit, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
