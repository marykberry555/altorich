import type { PostgrestError } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type WithdrawalRow = Database["public"]["Tables"]["withdrawals"]["Row"];
type WithdrawalInsert = Database["public"]["Tables"]["withdrawals"]["Insert"];

export function isPayoutSchemaCompatError(error: PostgrestError | null | undefined): boolean {
  if (!error) return false;
  const message = error.message.toLowerCase();
  return (
    error.code === "22P02" ||
    error.code === "42703" ||
    message.includes("scheduled") ||
    message.includes("request_type") ||
    message.includes("scheduled_at")
  );
}

export function normalizeWithdrawalRow(row: WithdrawalRow): WithdrawalRow {
  return {
    ...row,
    request_type: row.request_type ?? "manual",
    scheduled_at: row.scheduled_at ?? null,
    note: row.note ?? null,
    queue_number: row.queue_number ?? null,
    batch_number: row.batch_number ?? null,
    estimated_processing_at: row.estimated_processing_at ?? null,
    queued_at: row.queued_at ?? null,
    processing_started_at: row.processing_started_at ?? null,
    paid_at: row.paid_at ?? null,
    settlement_reference: row.settlement_reference ?? null,
    idempotency_key: row.idempotency_key ?? null
  };
}

export function toLegacyWithdrawalInsert(input: WithdrawalInsert): WithdrawalInsert {
  return {
    user_id: input.user_id,
    amount: input.amount,
    bank_name: input.bank_name,
    account_name: input.account_name,
    account_number: input.account_number,
    bank_account_id: input.bank_account_id ?? null,
    status: input.status === "scheduled" ? "pending" : input.status
  };
}
