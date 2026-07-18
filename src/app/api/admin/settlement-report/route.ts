import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/services";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { SettlementReportService, type SettlementReportPeriod } from "@/services/admin/settlement-report.service";
import { lagosDayKey } from "@/lib/finance/lagos-window";

export const dynamic = "force-dynamic";

function toCsv(rows: Record<string, unknown>[], columns: string[]) {
  const header = columns.join(",");
  const lines = rows.map((row) =>
    columns
      .map((col) => {
        const value = row[col];
        const str = value === null || value === undefined ? "" : String(value);
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  return [header, ...lines].join("\n");
}

export async function GET(request: NextRequest) {
  try {
    const services = await getAdminServices();
    if (!services) throw Errors.forbidden();

    const period = (request.nextUrl.searchParams.get("period") ?? "day") as SettlementReportPeriod;
    if (period !== "day" && period !== "week") throw Errors.badRequest("period must be day or week");

    const day = request.nextUrl.searchParams.get("day") ?? lagosDayKey();
    const format = request.nextUrl.searchParams.get("format") ?? "json";

    const report = await new SettlementReportService(services.supabase).build(period, day);

    if (format === "csv") {
      const csv = toCsv(
        report.lines.map((l) => ({
          kind: l.kind,
          id: l.id,
          user_id: l.user_id,
          member_name: l.member_name,
          amount: l.amount,
          status: l.status,
          settlement_reference: l.settlement_reference,
          bank_name: l.bank_name,
          account_number: l.account_number,
          paid_at: l.paid_at,
          queued_at: l.queued_at,
          wait_minutes: l.wait_minutes
        })),
        [
          "kind",
          "id",
          "user_id",
          "member_name",
          "amount",
          "status",
          "settlement_reference",
          "bank_name",
          "account_number",
          "paid_at",
          "queued_at",
          "wait_minutes"
        ]
      );
      const label = period === "week" ? `week-${report.weekStartKey}` : report.dayKey;
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="settlement-${label}.csv"`
        }
      });
    }

    return NextResponse.json(report);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
