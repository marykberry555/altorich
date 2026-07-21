import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth/session";
import { getUserServices } from "@/lib/services";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { REFERRAL_WALLET_CURRENCY } from "@/services/wallet/wallet.service";
import { WELCOME_BONUS_WALLET_CURRENCY } from "@/lib/welcome-bonus/config";

/** Placeholder export — returns CSV until PDF pipeline is connected. */
export async function GET() {
  try {
    const user = await requireSessionUser();
    const services = await getUserServices();
    if (!services) throw Errors.notConfigured();

    const currencies = ["NGN", WELCOME_BONUS_WALLET_CURRENCY, REFERRAL_WALLET_CURRENCY];
    const rows: string[] = ["wallet,type,amount,reference,reason,status,created_at"];

    for (const currency of currencies) {
      const wallet = await services.wallet.getWalletByUserId(user.id, currency).catch(() => null);
      if (!wallet) continue;
      const txs = await services.wallet.getTransactions(wallet.id, 500).catch(() => []);
      for (const tx of txs) {
        rows.push(
          [
            currency,
            tx.type,
            tx.amount,
            `"${String(tx.reference).replace(/"/g, '""')}"`,
            `"${String(tx.reason).replace(/"/g, '""')}"`,
            tx.status,
            tx.created_at
          ].join(",")
        );
      }
    }

    if (rows.length === 1) {
      return NextResponse.json({ message: "No transactions to export." }, { status: 404 });
    }

    const csv = rows.join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="alto-rich-transactions-${user.id.slice(0, 8)}.csv"`
      }
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
