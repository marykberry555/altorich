import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/services";
import { apiErrorResponse, Errors } from "@/lib/errors";

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

    const type = request.nextUrl.searchParams.get("type") ?? "deposits";

    if (type === "withdrawals") {
      const rows = await services.withdrawals.listRecent(500);
      const csv = toCsv(rows as unknown as Record<string, unknown>[], [
        "id",
        "user_id",
        "amount",
        "status",
        "bank_name",
        "account_number",
        "created_at"
      ]);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="withdrawals-${Date.now()}.csv"`
        }
      });
    }

    if (type === "members") {
      const { data } = await services.supabase
        .from("profiles")
        .select("id, full_name, phone, kyc_status, vip_level, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);
      const csv = toCsv((data ?? []) as Record<string, unknown>[], [
        "id",
        "full_name",
        "phone",
        "kyc_status",
        "vip_level",
        "created_at"
      ]);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="members-${Date.now()}.csv"`
        }
      });
    }

    const rows = await services.deposits.listRecent(500);
    const csv = toCsv(rows as unknown as Record<string, unknown>[], [
      "id",
      "member_name",
      "phone",
      "amount",
      "status",
      "reference",
      "payment_provider",
      "created_at"
    ]);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="deposits-${Date.now()}.csv"`
      }
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
