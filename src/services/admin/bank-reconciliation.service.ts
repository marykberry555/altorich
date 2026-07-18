import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { lagosDayBounds, lagosDayKey } from "@/lib/finance/lagos-window";
import {
  SettlementReportService,
  type SettlementReportLine
} from "@/services/admin/settlement-report.service";

type Client = SupabaseClient<Database>;

export type BankStatementLine = {
  /** Raw row index from the uploaded CSV (1-based data rows). */
  row: number;
  reference: string | null;
  amount: number;
  account_number: string | null;
  /** YYYY-MM-DD if present */
  date: string | null;
  raw: Record<string, string>;
};

export type BankMatchStatus = "matched" | "amount_mismatch" | "platform_unmatched" | "bank_unmatched";

export type BankReconciliationMatch = {
  status: BankMatchStatus;
  platform: SettlementReportLine | null;
  bank: BankStatementLine | null;
  expected_amount: number | null;
  bank_amount: number | null;
  delta: number | null;
  match_reason: string | null;
};

export type BankReconciliationResult = {
  dayKey: string;
  timezone: "Africa/Lagos";
  summary: {
    platformPaid: number;
    bankLines: number;
    matched: number;
    amountMismatch: number;
    platformUnmatched: number;
    bankUnmatched: number;
    platformTotal: number;
    bankTotal: number;
    deltaTotal: number;
  };
  matches: BankReconciliationMatch[];
};

function normalizeAccount(value: string | null | undefined): string {
  return String(value ?? "").replace(/\D/g, "");
}

function normalizeRef(value: string | null | undefined): string {
  return String(value ?? "").trim().toUpperCase();
}

function amountsClose(a: number, b: number, tolerance = 1): boolean {
  return Math.abs(a - b) <= tolerance;
}

function pickField(row: Record<string, string>, aliases: string[]): string | null {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const found = keys.find((k) => k.trim().toLowerCase() === alias);
    if (found && row[found]?.trim()) return row[found].trim();
  }
  for (const alias of aliases) {
    const found = keys.find((k) => k.trim().toLowerCase().includes(alias));
    if (found && row[found]?.trim()) return row[found].trim();
  }
  return null;
}

function parseAmount(raw: string | null): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[₦,\s]/g, "").replace(/[^\d.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.abs(n) : null;
}

function parseDay(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  const dmy = trimmed.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if (dmy) {
    const dd = dmy[1].padStart(2, "0");
    const mm = dmy[2].padStart(2, "0");
    return `${dmy[3]}-${mm}-${dd}`;
  }
  return null;
}

/** Parse a simple CSV (supports quoted fields). */
export function parseBankCsv(csvText: string): BankStatementLine[] {
  const lines = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  const rows: BankStatementLine[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cols = splitCsvLine(lines[i]);
    const raw: Record<string, string> = {};
    headers.forEach((h, idx) => {
      raw[h] = cols[idx] ?? "";
    });

    const amount = parseAmount(
      pickField(raw, ["amount", "debit", "credit", "transaction amount", "value", "ngn"])
    );
    if (amount == null || amount <= 0) continue;

    rows.push({
      row: i,
      reference: pickField(raw, [
        "reference",
        "narration",
        "description",
        "remarks",
        "settlement_reference",
        "ref",
        "transaction reference"
      ]),
      amount,
      account_number: pickField(raw, [
        "account_number",
        "account number",
        "beneficiary account",
        "account",
        "acct"
      ]),
      date: parseDay(pickField(raw, ["date", "value date", "transaction date", "posted", "paid_at"])),
      raw
    });
  }

  return rows;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

export class BankReconciliationService {
  private readonly reports: SettlementReportService;

  constructor(private readonly supabase: Client) {
    this.reports = new SettlementReportService(supabase);
  }

  async reconcile(dayKey = lagosDayKey(), bankLines: BankStatementLine[]): Promise<BankReconciliationResult> {
    const report = await this.reports.build("day", dayKey);
    const platform = report.lines.filter((l) => l.kind === "withdrawal");
    const usedBank = new Set<number>();
    const matches: BankReconciliationMatch[] = [];

    for (const p of platform) {
      const byRef = bankLines.find(
        (b, idx) =>
          !usedBank.has(idx) &&
          p.settlement_reference &&
          b.reference &&
          normalizeRef(b.reference).includes(normalizeRef(p.settlement_reference))
      );

      if (byRef) {
        const idx = bankLines.indexOf(byRef);
        usedBank.add(idx);
        const close = amountsClose(p.amount, byRef.amount);
        matches.push({
          status: close ? "matched" : "amount_mismatch",
          platform: p,
          bank: byRef,
          expected_amount: p.amount,
          bank_amount: byRef.amount,
          delta: byRef.amount - p.amount,
          match_reason: close ? "settlement_reference" : "settlement_reference_amount_mismatch"
        });
        continue;
      }

      const acct = normalizeAccount(p.account_number);
      const byAcct = bankLines.find((b, idx) => {
        if (usedBank.has(idx) || !acct) return false;
        if (normalizeAccount(b.account_number) !== acct) return false;
        if (b.date && b.date !== dayKey) return false;
        return amountsClose(p.amount, b.amount);
      });

      if (byAcct) {
        const idx = bankLines.indexOf(byAcct);
        usedBank.add(idx);
        matches.push({
          status: "matched",
          platform: p,
          bank: byAcct,
          expected_amount: p.amount,
          bank_amount: byAcct.amount,
          delta: byAcct.amount - p.amount,
          match_reason: "account_amount"
        });
        continue;
      }

      const soft = bankLines.find((b, idx) => {
        if (usedBank.has(idx) || !acct) return false;
        return normalizeAccount(b.account_number) === acct;
      });

      if (soft) {
        const idx = bankLines.indexOf(soft);
        usedBank.add(idx);
        matches.push({
          status: "amount_mismatch",
          platform: p,
          bank: soft,
          expected_amount: p.amount,
          bank_amount: soft.amount,
          delta: soft.amount - p.amount,
          match_reason: "account_only_amount_mismatch"
        });
        continue;
      }

      matches.push({
        status: "platform_unmatched",
        platform: p,
        bank: null,
        expected_amount: p.amount,
        bank_amount: null,
        delta: null,
        match_reason: null
      });
    }

    bankLines.forEach((b, idx) => {
      if (usedBank.has(idx)) return;
      matches.push({
        status: "bank_unmatched",
        platform: null,
        bank: b,
        expected_amount: null,
        bank_amount: b.amount,
        delta: null,
        match_reason: null
      });
    });

    const matched = matches.filter((m) => m.status === "matched").length;
    const amountMismatch = matches.filter((m) => m.status === "amount_mismatch").length;
    const platformUnmatched = matches.filter((m) => m.status === "platform_unmatched").length;
    const bankUnmatched = matches.filter((m) => m.status === "bank_unmatched").length;
    const platformTotal = platform.reduce((s, l) => s + l.amount, 0);
    const bankTotal = bankLines.reduce((s, l) => s + l.amount, 0);

    // Ensure day bounds exist for callers that only need timezone context.
    void lagosDayBounds(dayKey);

    return {
      dayKey,
      timezone: "Africa/Lagos",
      summary: {
        platformPaid: platform.length,
        bankLines: bankLines.length,
        matched,
        amountMismatch,
        platformUnmatched,
        bankUnmatched,
        platformTotal,
        bankTotal,
        deltaTotal: bankTotal - platformTotal
      },
      matches
    };
  }
}
