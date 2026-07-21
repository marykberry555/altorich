import type { Withdrawal } from "@/types/database";
import { payoutStatusLabel } from "@/lib/payout/status";
import { formatSettlementEtaShort } from "@/lib/payout/settlement-queue";
import type { OperationalStep } from "./types";
import { formatFinancialDateTime, formatFinancialTime, formatDurationMs } from "./format";

export type WithdrawalTrackerView = {
  id: string;
  reference: string;
  amount: number;
  statusLabel: string;
  queuePosition: number | null;
  estimatedProcessingLabel: string | null;
  schedulingMessage: string;
  requestedAt: string;
  approvedAt: string | null;
  paidAt: string | null;
  processingDuration: string | null;
  fundSourceLabel: string;
  bankDestination: string;
  steps: OperationalStep[];
  isTerminal: boolean;
};

const TERMINAL = new Set(["paid", "rejected", "cancelled"]);

function withdrawalReference(row: Withdrawal) {
  return row.settlement_reference ?? row.id.slice(0, 8).toUpperCase();
}

function fundSourceLabel(source: Withdrawal["fund_source"]) {
  return source === "welcome_bonus" ? "Welcome Bonus Wallet" : "NGN Wallet";
}

export function buildWithdrawalSteps(row: Withdrawal): OperationalStep[] {
  const status = row.status;
  const isPaid = status === "paid";
  const isRejected = status === "rejected" || status === "cancelled";
  const hasQueue = Boolean(row.queue_number ?? row.queued_at);
  const isProcessing = status === "processing" || Boolean(row.processing_started_at);
  const isApproved = ["approved", "processing", "paid"].includes(status);

  const step = (id: string, label: string, complete: boolean, current: boolean, timestamp?: string | null): OperationalStep => ({
    id,
    label,
    status: isRejected && !complete ? "failed" : complete ? "complete" : current ? "current" : "pending",
    timestamp: timestamp ?? null
  });

  const requestedDone = true;
  const queueDone = hasQueue || isApproved || isProcessing || isPaid;
  const queueCurrent = requestedDone && !queueDone && !isRejected;
  const processingDone = isProcessing || isPaid;
  const processingCurrent = queueDone && !processingDone && !isRejected;
  const transferDone = isPaid;
  const transferCurrent = processingDone && !transferDone && !isRejected;
  const completedDone = isPaid;

  return [
    step("requested", "Requested", requestedDone, false, row.created_at),
    step("queued", "Queue Assigned", queueDone, queueCurrent, row.queued_at),
    step("processing", "Processing", processingDone, processingCurrent, row.processing_started_at),
    step("transfer", "Bank Transfer", transferDone, transferCurrent, row.reviewed_at),
    step("completed", "Completed", completedDone, false, row.paid_at)
  ];
}

export function buildWithdrawalTrackerView(row: Withdrawal): WithdrawalTrackerView {
  const statusLabel = payoutStatusLabel(row);
  const hasQueueData = row.queue_number != null || row.estimated_processing_at != null;

  let estimatedProcessingLabel: string | null = null;
  if (row.estimated_processing_at) {
    estimatedProcessingLabel = formatSettlementEtaShort(new Date(row.estimated_processing_at));
  }

  const schedulingMessage = hasQueueData ? "" : "Waiting to be scheduled.";

  const processingDuration =
    row.paid_at && row.created_at
      ? formatDurationMs(new Date(row.paid_at).getTime() - new Date(row.created_at).getTime())
      : row.processing_started_at && row.created_at
        ? formatDurationMs(Date.now() - new Date(row.created_at).getTime())
        : null;

  return {
    id: row.id,
    reference: withdrawalReference(row),
    amount: Number(row.amount),
    statusLabel,
    queuePosition: row.queue_number ?? null,
    estimatedProcessingLabel,
    schedulingMessage,
    requestedAt: formatFinancialTime(row.created_at),
    approvedAt: row.reviewed_at ? formatFinancialDateTime(row.reviewed_at) : null,
    paidAt: row.paid_at ? formatFinancialDateTime(row.paid_at) : null,
    processingDuration,
    fundSourceLabel: fundSourceLabel(row.fund_source),
    bankDestination: `${row.bank_name} · ${row.account_number.slice(-4).padStart(row.account_number.length, "•")}`,
    steps: buildWithdrawalSteps(row),
    isTerminal: TERMINAL.has(row.status)
  };
}

export function findActiveWithdrawal(rows: Withdrawal[]): Withdrawal | null {
  return rows.find((r) => !TERMINAL.has(r.status)) ?? null;
}
