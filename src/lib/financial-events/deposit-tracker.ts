import type { Deposit } from "@/types/database";
import type { DepositWorkflowPhase } from "@/lib/finance/deposit-workflow";
import type { OperationalStep } from "./types";
import { formatFinancialDateTime } from "./format";

export type DepositTrackerView = {
  id: string;
  reference: string;
  amount: number;
  statusLabel: string;
  proofUrl: string | null;
  steps: OperationalStep[];
  isTerminal: boolean;
  reviewedAt: string | null;
  creditedAt: string | null;
  investmentNote: string | null;
};

const MEMBER_STAGES: { id: string; label: string; phases: DepositWorkflowPhase[] }[] = [
  { id: "submitted", label: "Transfer Submitted", phases: ["pending"] },
  { id: "receipt", label: "Receipt Uploaded", phases: ["pending", "claimed"] },
  { id: "review", label: "Awaiting Review", phases: ["pending", "claimed"] },
  { id: "verified", label: "Verified", phases: ["claimed", "wallet_credited", "investment_created", "reconciled", "completed"] },
  { id: "credited", label: "Wallet Credited", phases: ["wallet_credited", "investment_created", "reconciled", "completed"] },
  { id: "investment", label: "Investment Started", phases: ["investment_created", "reconciled", "completed"] }
];

function depositReference(row: Deposit) {
  return row.reference?.trim() || row.receipt_note?.trim() || row.id.slice(0, 8).toUpperCase();
}

function statusLabel(row: Deposit) {
  if (row.status === "rejected") return "Rejected";
  if (row.status === "completed" || row.workflow_phase === "completed") return "Completed";
  if (row.status === "approved") return "Approved";
  return "Pending review";
}

function phaseIndex(phase: DepositWorkflowPhase) {
  const order: DepositWorkflowPhase[] = [
    "pending",
    "claimed",
    "wallet_credited",
    "investment_created",
    "reconciled",
    "completed"
  ];
  return order.indexOf(phase);
}

export function buildDepositSteps(row: Deposit): OperationalStep[] {
  const phase = (row.workflow_phase ?? "pending") as DepositWorkflowPhase;
  const rejected = row.status === "rejected" || phase === "failed";
  const idx = phaseIndex(phase);
  const hasReceipt = Boolean(row.proof_url?.trim());

  const stages = MEMBER_STAGES.map((stage, stageIdx) => {
    let complete = false;
    if (rejected) {
      complete = stageIdx === 0;
    } else if (stage.id === "receipt") {
      complete = hasReceipt || idx >= phaseIndex("claimed");
    } else if (stage.id === "submitted") {
      complete = true;
    } else if (stage.id === "review") {
      complete = idx >= phaseIndex("claimed") || row.status === "approved";
    } else if (stage.id === "verified") {
      complete = idx >= phaseIndex("wallet_credited") || row.status === "approved";
    } else if (stage.id === "credited") {
      complete = idx >= phaseIndex("wallet_credited");
    } else if (stage.id === "investment") {
      complete = idx >= phaseIndex("investment_created");
    }
    return { stage, complete, stageIdx };
  });

  return stages.map(({ stage, complete, stageIdx }, i) => {
    const prevComplete = i === 0 || stages[i - 1]?.complete;
    const current = !rejected && !complete && Boolean(prevComplete);

    let timestamp: string | null = null;
    if (stage.id === "submitted") timestamp = row.created_at;
    if (stage.id === "verified" && row.reviewed_at) timestamp = row.reviewed_at;
    if ((stage.id === "credited" || stage.id === "investment") && complete) timestamp = row.workflow_updated_at;

    return {
      id: stage.id,
      label: stage.label,
      status: rejected && stageIdx > 0 && !complete ? "failed" : complete ? "complete" : current ? "current" : "pending",
      timestamp
    } satisfies OperationalStep;
  });
}

export function buildDepositTrackerView(row: Deposit): DepositTrackerView {
  const phase = (row.workflow_phase ?? "pending") as DepositWorkflowPhase;
  const terminal = row.status === "rejected" || phase === "failed" || phase === "completed" || row.status === "completed";

  return {
    id: row.id,
    reference: depositReference(row),
    amount: Number(row.amount),
    statusLabel: statusLabel(row),
    proofUrl: row.proof_url,
    steps: buildDepositSteps(row),
    isTerminal: terminal,
    reviewedAt: row.reviewed_at ? formatFinancialDateTime(row.reviewed_at) : null,
    creditedAt: phaseIndex(phase) >= phaseIndex("wallet_credited") ? formatFinancialDateTime(row.workflow_updated_at) : null,
    investmentNote:
      phaseIndex(phase) >= phaseIndex("investment_created")
        ? "Allocated to your selected investment portfolio."
        : null
  };
}

export function findActiveDeposit(rows: Deposit[]): Deposit | null {
  return (
    rows.find((r) => {
      const phase = (r.workflow_phase ?? "pending") as DepositWorkflowPhase;
      return r.status === "pending" || (r.status === "approved" && phase !== "completed" && phase !== "failed");
    }) ?? null
  );
}
