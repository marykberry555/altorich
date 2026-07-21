import type { Deposit } from "@/types/database";
import { DepositHistoryList } from "@/components/financial/DepositHistoryList";

type Props = {
  rows: Deposit[];
};

/** @deprecated Prefer DepositHistoryList */
export function FundingHistoryTable({ rows }: Props) {
  return <DepositHistoryList rows={rows} />;
}
