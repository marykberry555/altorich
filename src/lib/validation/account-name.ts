export function normalizeAccountHolderName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/^(mr|mrs|miss|ms|dr|chief|alhaji|alh|eng|engr|pastor|rev)\.?\s+/i, "");
}

/** Exact or reasonable token overlap match for identity checks. */
export function accountNamesMatch(registeredName: string, accountName: string): boolean {
  const left = normalizeAccountHolderName(registeredName);
  const right = normalizeAccountHolderName(accountName);
  if (!left || !right) return false;
  if (left === right) return true;

  const leftTokens = left.split(" ").filter((t) => t.length > 1);
  const rightTokens = right.split(" ").filter((t) => t.length > 1);
  if (leftTokens.length === 0 || rightTokens.length === 0) return false;

  const rightSet = new Set(rightTokens);
  const leftCovered = leftTokens.every((t) => rightSet.has(t));
  if (leftCovered) return true;

  const leftSet = new Set(leftTokens);
  return rightTokens.every((t) => leftSet.has(t));
}

export const ACCOUNT_NAME_MISMATCH_MESSAGE =
  "The bank account name does not match your registered full name. For your security, withdrawals can only be made to an account in your verified name. Contact Alto Rich Support if your legal name has changed.";
