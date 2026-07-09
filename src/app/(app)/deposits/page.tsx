import Link from "next/link";
import { Suspense } from "react";
import { ContributionForm } from "@/components/ContributionForm";
import { PaystackFundButton } from "@/components/deposits/PaystackFundButton";
import { PaymentVerifyBanner } from "@/components/deposits/PaymentVerifyBanner";
import { PageHero } from "@/components/marketing/PageHero";
import { getPublicServices } from "@/lib/services";
import { isPaystackConfigured } from "@/lib/env";
import { Card } from "@/components/ui/Card";

export default async function DepositsPage() {
  const services = await getPublicServices();
  const bank = services
    ? await services.settings.getBankSwitchboard()
    : {
        active_bank_name: "Configure in admin",
        active_account_name: "ALTORICH LTD",
        active_account_number: "00000000",
        payment_instruction: "Connect Supabase to load live bank details.",
        transfer_narration: "Use your phone as transfer narration.",
        contributions_enabled: false
      };

  const config = {
    activeBankName: bank.active_bank_name,
    activeAccountName: bank.active_account_name,
    activeAccountNumber: bank.active_account_number,
    paymentInstruction: bank.payment_instruction,
    transferNarration: bank.transfer_narration,
    contributionsEnabled: bank.contributions_enabled
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHero
        eyebrow="Deposits"
        title="Fund your wallet"
        description="Pay instantly with Paystack or transfer to our bank account. Funds are credited only after server-side verification."
      />

      <Suspense fallback={null}>
        <PaymentVerifyBanner />
      </Suspense>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <PaystackFundButton enabled={config.contributionsEnabled} configured={isPaystackConfigured()} />
        <Card variant="elevated" className="h-fit">
          <h2 className="font-semibold text-[var(--heading)]">Bank transfer</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {config.paymentInstruction || "Transfer to the published account, then submit your reference below."}
          </p>
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="text-[var(--text-subtle)]">Bank</dt>
              <dd className="font-medium">{config.activeBankName}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-subtle)]">Account</dt>
              <dd className="font-medium">
                {config.activeAccountName} · {config.activeAccountNumber}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-subtle)]">Narration</dt>
              <dd>{config.transferNarration}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ContributionForm config={config} />
        </div>
        <Card variant="elevated" className="h-fit lg:col-span-2">
          <h2 className="font-semibold text-[var(--heading)]">Deposit instructions</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-4 text-sm text-[var(--text-muted)]">
            <li>Select your contribution tier or enter the exact amount shown.</li>
            <li>Pay with Paystack or make a bank transfer.</li>
            <li>Use your phone number as the transfer narration for bank deposits.</li>
            <li>Submit your reference and receipt note for manual bank transfers.</li>
            <li>Paystack payments credit automatically after verification.</li>
          </ol>
          <Link href="/portfolio" className="mt-6 inline-block text-sm font-semibold text-[var(--emerald)]">
            View portfolio →
          </Link>
        </Card>
      </div>
    </div>
  );
}
