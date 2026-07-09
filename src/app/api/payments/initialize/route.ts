import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { contributionTiers } from "@/lib/domain";
import { getUserServices } from "@/lib/services";
import { getSessionUser } from "@/lib/auth/session";
import { apiErrorResponse, Errors } from "@/lib/errors";
import { isPaystackConfigured } from "@/lib/env";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";
import { sanitizePhone, sanitizeText } from "@/lib/security/sanitize";

const schema = z.object({
  amount: z.number().positive(),
  phone: z.string().min(10).optional()
});

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const limit = rateLimit(`payments:init:${ip}`, 20, 60_000);
    if (!limit.ok) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    if (!isPaystackConfigured()) {
      throw Errors.badRequest("Paystack is not configured on this environment.");
    }

    const user = await getSessionUser();
    if (!user?.email) throw Errors.unauthorized();

    const services = await getUserServices();
    if (!services) throw Errors.notConfigured();

    const body = await request.json();
    const parsed = schema.safeParse({ ...body, amount: Number(body.amount) });
    if (!parsed.success) throw Errors.badRequest("Invalid payment payload.");

    const { amount, phone: phoneInput } = parsed.data;
    if (!contributionTiers.includes(amount as (typeof contributionTiers)[number])) {
      throw Errors.badRequest("Unsupported contribution tier.");
    }

    const bank = await services.settings.getBankSwitchboard();
    if (!bank.contributions_enabled) {
      return NextResponse.json({ error: "Contributions are temporarily disabled." }, { status: 403 });
    }

    const { data: profile } = await services.supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .single();

    const phone = sanitizePhone(phoneInput ?? profile?.phone ?? "");
    if (phone.length < 10) {
      throw Errors.badRequest("Add a valid phone number in your profile before funding.");
    }

    const result = await services.payments.initializePaystack({
      userId: user.id,
      email: user.email,
      amount,
      memberName: sanitizeText(profile?.full_name ?? user.email.split("@")[0] ?? "Member", 120),
      phone
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
