import { Suspense } from "react";
import { PersonalDocumentsHub } from "@/components/member-experience/PersonalDocumentsHub";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { buildDocumentCatalog } from "@/lib/member-experience/documents";
import { getUserServices } from "@/lib/services";
import { getSessionUser } from "@/lib/auth/session";

async function DocumentsContent() {
  const user = await getSessionUser();
  const services = await getUserServices();

  let hasWalletActivity = false;
  let hasInvestments = false;
  let hasWelcomeBonus = false;
  let hasReferrals = false;

  if (user && services) {
    const [dashboard, welcomeBonus, deposits, withdrawals] = await Promise.all([
      services.dashboard.getMemberDashboard(user.id).catch(() => null),
      services.welcomeBonus.getMemberView(user.id).catch(() => null),
      services.deposits.listForUser(user.id, 5).catch(() => []),
      services.withdrawals.listForUser(user.id, 5).catch(() => [])
    ]);

    hasWalletActivity =
      (dashboard?.recentTransactions?.length ?? 0) > 0 ||
      deposits.some((d) => ["approved", "completed"].includes(d.status)) ||
      withdrawals.some((w) => ["approved", "paid"].includes(w.status));
    hasInvestments = (dashboard?.activeInvestments ?? 0) > 0;
    hasWelcomeBonus = Boolean(welcomeBonus?.allocated);
    hasReferrals = (dashboard?.referralCount ?? 0) > 0;
  }

  const documents = buildDocumentCatalog({
    hasWalletActivity,
    hasInvestments,
    hasWelcomeBonus,
    hasReferrals
  });

  return (
    <div className="mx-auto max-w-3xl pb-6">
      <PersonalDocumentsHub documents={documents} />
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DocumentsContent />
    </Suspense>
  );
}
