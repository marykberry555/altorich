import { FundingAccountsAdmin } from "@/components/admin/FundingAccountsAdmin";
import { getServiceRoleServices } from "@/lib/services";

export const dynamic = "force-dynamic";

export default async function AdminFundingAccountsPage() {
  const services = await getServiceRoleServices();
  const accounts = services ? await services.fundingAccounts.listAll().catch(() => []) : [];

  return <FundingAccountsAdmin initialAccounts={accounts} />;
}
