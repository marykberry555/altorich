/** Deposit approval orchestration phases (recoverable). */
export type DepositWorkflowPhase =
  | "pending"
  | "claimed"
  | "wallet_credited"
  | "investment_created"
  | "reconciled"
  | "completed"
  | "failed";

export const DEPOSIT_WORKFLOW_ORDER: DepositWorkflowPhase[] = [
  "pending",
  "claimed",
  "wallet_credited",
  "investment_created",
  "reconciled",
  "completed"
];

export function nextDepositWorkflowPhase(phase: DepositWorkflowPhase): DepositWorkflowPhase | null {
  const idx = DEPOSIT_WORKFLOW_ORDER.indexOf(phase);
  if (idx < 0 || idx >= DEPOSIT_WORKFLOW_ORDER.length - 1) return null;
  return DEPOSIT_WORKFLOW_ORDER[idx + 1];
}

export function isTerminalDepositWorkflow(phase: DepositWorkflowPhase) {
  return phase === "completed" || phase === "failed";
}

export function isStuckDepositWorkflow(phase: DepositWorkflowPhase, updatedAt: string | Date, now = new Date(), stuckMs = 5 * 60_000) {
  if (isTerminalDepositWorkflow(phase) || phase === "pending") return false;
  const at = typeof updatedAt === "string" ? new Date(updatedAt) : updatedAt;
  return now.getTime() - at.getTime() >= stuckMs;
}

/** Pure helpers used by concurrency CI assertions. */
export function assertExactlyOne<T>(items: T[], label: string) {
  if (items.length !== 1) {
    throw new Error(`Expected exactly one ${label}, got ${items.length}`);
  }
  return items[0];
}

export function groupByKey<T>(items: T[], keyFn: (item: T) => string) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return map;
}

export function countDuplicatesByKey<T>(items: T[], keyFn: (item: T) => string) {
  const grouped = groupByKey(items, keyFn);
  let duplicates = 0;
  for (const [, rows] of grouped) {
    if (rows.length > 1) duplicates += rows.length - 1;
  }
  return duplicates;
}
