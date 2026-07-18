import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { makeReference } from "@/lib/domain";
import { MIN_FUNDING_AMOUNT_NGN } from "@/lib/payments";
import { getPublicServices, getServiceRoleServices } from "@/lib/services";
import { getSessionUser, hasAdminRole, requireSessionUser } from "@/lib/auth/session";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { logger } from "@/lib/logger";

const depositSchema = z.object({
  memberName: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  amount: z.number(),
  paymentReference: z.string().max(120).optional(),
  receiptNote: z.string().max(120).optional(),
  reference: z.string().max(120).optional(),
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
    // Service role: deposit insert must work even when client RLS is locked down.
    const user = await requireSessionUser();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const body = await request.json();
    const parsed = depositSchema.safeParse({
      ...body,
      amount: Number(body.amount)
    });

    if (!parsed.success) {
      throw Errors.badRequest("Invalid deposit payload.");
    }

    const profile = await services.profile.getProfile(user.id).catch(() => null);

    // Member identity for admin review (who submitted) — not the bank sender name.
    const memberName =
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

    // Transfer reference is optional.
    const paymentReference =
      parsed.data.paymentReference?.trim() ||
      parsed.data.reference?.trim() ||
      parsed.data.receiptNote?.trim() ||
      "";

    const { amount, proofUrl } = parsed.data;

    if (amount < MIN_FUNDING_AMOUNT_NGN) {
      throw Errors.badRequest(`Minimum funding amount is ₦${MIN_FUNDING_AMOUNT_NGN.toLocaleString("en-NG")}.`);
    }

    const bank = await services.settings.getBankSwitchboard();
    if (!bank.contributions_enabled) {
      return NextResponse.json({ error: "Wallet funding is temporarily disabled." }, { status: 403 });
    }

    // Prevent duplicate pending queue from double-taps / retries.
    const stats = await services.deposits.getUserStats(user.id).catch(() => ({ pending: 0, approved: 0, count: 0 }));
    const pendingCount = await services.deposits
      .listForUser(user.id, 20)
      .then((rows) => rows.filter((d) => d.status === "pending").length)
      .catch(() => 0);
    if (pendingCount >= 3) {
      throw Errors.business(
        "You already have pending funding requests. Wait for admin verification before submitting another.",
        "PENDING_DEPOSIT_LIMIT",
        { label: "View funding", href: "/deposits" }
      );
    }

    const idempotencyKey =
      request.headers.get("idempotency-key")?.trim() ||
      (typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "") ||
      "";

    // Always generate a unique internal reference (DB UNIQUE). Optional transfer
    // refs live in receipt_note for admin verification only.
    // When an Idempotency-Key is supplied, reuse it as the unique reference so retries return the same logical deposit attempt.
    const reference = idempotencyKey
      ? `IDEM-${user.id.slice(0, 8)}-${idempotencyKey}`.slice(0, 120)
      : makeReference(phone);

    if (idempotencyKey) {
      const existing = await services.deposits
        .listForUser(user.id, 50)
        .then((rows) => rows.find((d) => d.reference === reference))
        .catch(() => null);
      if (existing) {
        return NextResponse.json(existing, { status: 200 });
      }
    }

    const deposit = await services.deposits.create({
      memberName,
      phone,
      amount,
      receiptNote: paymentReference,
      reference,
      userId: user.id,
      proofUrl
    });

    logger.info("Deposit created", {
      depositId: deposit.id,
      userId: user.id,
      hasReference: Boolean(paymentReference),
      pendingBefore: stats.pending
    });
    return NextResponse.json(deposit, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
