import type { Withdrawal } from "@/types/database";
import { WithdrawalHistoryList } from "@/components/financial/WithdrawalHistoryList";

type Props = {
  rows: Withdrawal[];
};

/** @deprecated Prefer WithdrawalHistoryList */
export function PayoutHistoryTable({ rows }: Props) {
  return <WithdrawalHistoryList rows={rows} />;
}
