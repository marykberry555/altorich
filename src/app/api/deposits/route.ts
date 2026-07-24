import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { makeReference } from "@/lib/domain";
import { MIN_FUNDING_AMOUNT_NGN } from "@/lib/payments";
import { getPublicServices, getServiceRoleServices } from "@/lib/services";
import { getSessionUser, hasAdminRole, requireDepositUser, requireSessionUser } from "@/lib/auth/session";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { logger } from "@/lib/logger";
import { enforceRateLimit } from "@/lib/security/rate-limit";

const depositSchema = z.object({
  memberName: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  amount: z.number(),
  paymentReference: z.string().max(120).optional(),
  receiptNote: z.string().max(120).optional(),
  reference: z.string().max(120).optional(),
  proofUrl: z.string().min(3).max(500).optional(),
  rail: z.enum(["bank", "crypto"]).optional(),
  asset: z.enum(["USDT", "USDC", "BTC", "ETH"]).optional(),
  network: z.enum(["TRC20", "ERC20", "BEP20", "POLYGON", "BITCOIN"]).optional()
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
    return apiErrorResponse(error, { route: "/api/deposits" });
  }
}

export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, "depositCreate");
    if (limited) return limited;

    const user = await requireDepositUser();
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
    const rail = parsed.data.rail === "crypto" ? "crypto" : "bank";

    if (amount < MIN_FUNDING_AMOUNT_NGN) {
      throw Errors.badRequest(`Minimum funding amount is ₦${MIN_FUNDING_AMOUNT_NGN.toLocaleString("en-NG")}.`);
    }

    await services.paymentRails.assertDepositAllowed(rail);

    if (rail === "crypto") {
      if (!parsed.data.asset || !parsed.data.network) {
        throw Errors.badRequest("Select a cryptocurrency and network for crypto deposits.");
      }
      await services.paymentRails.resolveDepositAddress(parsed.data.asset, parsed.data.network);
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

    const { encodeCryptoDepositNote } = await import("@/lib/payments/member-destinations");
    const receiptNote =
      rail === "crypto" && parsed.data.asset && parsed.data.network
        ? encodeCryptoDepositNote({
            asset: parsed.data.asset,
            network: parsed.data.network,
            paymentReference
          })
        : paymentReference;

    const deposit = await services.deposits.create({
      memberName,
      phone,
      amount,
      receiptNote,
      reference,
      userId: user.id,
      proofUrl
    });

    logger.info("Deposit created", {
      depositId: deposit.id,
      userId: user.id,
      hasReference: Boolean(paymentReference),
      pendingBefore: stats.pending,
      rail
    });
    return NextResponse.json({ ...deposit, rail }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
