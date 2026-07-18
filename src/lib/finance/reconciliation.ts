import { AppError } from "@/lib/errors";

/** Round money to kobo (2 dp) for ledger comparisons. */
export function roundNaira(amount: number): number {
  return Math.round((Number(amount) + Number.EPSILON) * 100) / 100;
}

export function moneyEqual(a: number, b: number, tolerance = 0): boolean {
  return Math.abs(roundNaira(a) - roundNaira(b)) <= tolerance;
}

/**
 * After deposit credit + auto-invest:
 *   walletBefore + deposit - invested = walletAfter
 *
 * And (equivalent when no other movements):
 *   invested + walletAfter = walletBefore + deposit
 *
 * Prefer full invest: walletAfter ≈ 0 when investing entire available balance.
 */
export function assertDepositInvestReconciliation(input: {
  walletBefore: number;
  depositAmount: number;
  investedAmount: number;
  walletAfter: number;
}) {
  const expectedAfter = roundNaira(input.walletBefore + input.depositAmount - input.investedAmount);
  const actualAfter = roundNaira(input.walletAfter);
  if (!moneyEqual(expectedAfter, actualAfter)) {
    throw new AppError(
      `Ledger reconciliation failed: expected wallet ₦${expectedAfter.toLocaleString("en-NG")}, got ₦${actualAfter.toLocaleString("en-NG")}.`,
      500,
      "LEDGER_RECONCILIATION_FAILED"
    );
  }

  const expectedSources = roundNaira(input.walletBefore + input.depositAmount);
  const actualSources = roundNaira(input.investedAmount + input.walletAfter);
  if (!moneyEqual(expectedSources, actualSources)) {
    throw new AppError(
      `Ledger identity failed: investment + wallet (₦${actualSources.toLocaleString("en-NG")}) ≠ prior wallet + deposit (₦${expectedSources.toLocaleString("en-NG")}).`,
      500,
      "LEDGER_RECONCILIATION_FAILED"
    );
  }
}

/** True when auto-invest consumed prior leftover wallet funds beyond this deposit. */
export function isLegacyCapHealing(walletBefore: number, depositAmount: number, investedAmount: number) {
  return roundNaira(walletBefore) > 0.01 && roundNaira(investedAmount) > roundNaira(depositAmount) + 0.01;
}

export const LEGACY_CAP_HEALING_MESSAGE =
  "Funds remaining from a previous investment limit have now been invested automatically.";
