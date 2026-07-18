import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { getUserServices } from "@/lib/services";

export async function GET() {
  try {
    const services = await getUserServices();
    if (!services) {
      return NextResponse.json({ accounts: [] });
    }

    const accounts = await services.fundingAccounts.listActive();
    return NextResponse.json({
      accounts: accounts.map((account) => ({
        id: account.id,
        bankName: account.bank_name,
        accountName: account.account_name,
        accountNumber: account.account_number,
        displayName: account.display_name,
        fundingInstructions: account.funding_instructions,
        isPreferred: account.is_preferred
      }))
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
