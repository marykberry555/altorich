import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/services";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import {
  BankReconciliationService,
  parseBankCsv,
  type BankStatementLine
} from "@/services/admin/bank-reconciliation.service";
import { lagosDayKey } from "@/lib/finance/lagos-window";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const services = await getAdminServices();
    if (!services) throw Errors.forbidden();

    const contentType = request.headers.get("content-type") ?? "";
    let dayKey = lagosDayKey();
    let bankLines: BankStatementLine[] = [];

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      dayKey = String(form.get("day") ?? dayKey);
      const file = form.get("file");
      if (!(file instanceof File)) throw Errors.badRequest("CSV file required");
      const text = await file.text();
      bankLines = parseBankCsv(text);
    } else {
      const body = (await request.json().catch(() => ({}))) as {
        day?: string;
        csv?: string;
        lines?: BankStatementLine[];
      };
      dayKey = body.day ?? dayKey;
      if (body.lines?.length) bankLines = body.lines;
      else if (body.csv) bankLines = parseBankCsv(body.csv);
      else throw Errors.badRequest("Provide csv text or lines[]");
    }

    if (bankLines.length === 0) throw Errors.badRequest("No bank debit rows found in CSV");

    const result = await new BankReconciliationService(services.supabase).reconcile(dayKey, bankLines);
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
