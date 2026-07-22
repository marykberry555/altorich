import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/services";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { requireAdmin } from "@/lib/auth/session";
import { requireFinanceAdmin } from "@/lib/auth/finance-auth";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const services = await getAdminServices();
    if (!services) throw Errors.forbidden();
    const snapshot = await services.welcomeBonus.getAdminSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    return apiErrorResponse(error, { route: "/api/admin/welcome-bonus" });
  }
}

export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, "adminFinanceAction");
    if (limited) return limited;

    const admin = await requireFinanceAdmin("welcome_bonus.admin");
    const services = await getAdminServices();
    if (!services) throw Errors.forbidden();

    const body = await request.json().catch(() => ({}));
    const action = String(body.action ?? "");

    if (action === "update_config") {
      const config = await services.welcomeBonus.updateConfig(
        {
          enabled: typeof body.enabled === "boolean" ? body.enabled : undefined,
          amount_ngn: body.amount_ngn != null ? Number(body.amount_ngn) : undefined,
          max_allocations: body.max_allocations != null ? Number(body.max_allocations) : undefined,
          qualification_days: body.qualification_days != null ? Number(body.qualification_days) : undefined
        },
        admin.id
      );
      return NextResponse.json({ ok: true, config });
    }

    if (action === "unlock_due") {
      const results = await services.welcomeBonus.unlockDue(new Date(), Number(body.limit ?? 200));
      return NextResponse.json({ ok: true, results });
    }

    throw Errors.badRequest("Unknown action");
  } catch (error) {
    return apiErrorResponse(error, { route: "/api/admin/welcome-bonus" });
  }
}
