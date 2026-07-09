import { LegalDocument } from "@/components/marketing/LegalDocument";
import { COMPANY } from "@/lib/company";

export default function RiskPage() {
  return (
    <LegalDocument title="Risk Disclosure" lastUpdated="1 July 2025">
      <h2>Important notice</h2>
      <p>
        Participation in {COMPANY.brand} cooperative products involves financial risk. You should read this disclosure
        carefully and only commit funds you can afford to lose without affecting your essential living expenses.
      </p>

      <h2>No guaranteed returns</h2>
      <p>
        Projected daily figures, cycle totals, and bonus amounts displayed on the platform are cooperative estimates
        based on documented pool performance. They are not promises, guarantees, or fixed interest rates. Actual
        distributions may be lower than projected, delayed, or absent depending on verified pool earnings and
        operational conditions.
      </p>

      <h2>Not a bank deposit</h2>
      <p>
        Funds placed in {COMPANY.brand} products are not bank deposits and are not protected by the Nigeria Deposit
        Insurance Corporation (NDIC) or the UK Financial Services Compensation Scheme (FSCS).
      </p>

      <h2>Liquidity risk</h2>
      <p>
        Many products have defined cycle lengths and settlement windows. Early withdrawal may not be available, or may
        attract fees or reduced benefits. Plan your participation around published timelines.
      </p>

      <h2>Operational risk</h2>
      <p>
        Platform availability, bank transfer delays, verification backlogs, and third-party service interruptions may
        affect deposit crediting and withdrawal processing times.
      </p>

      <h2>Market and sector risk</h2>
      <p>
        Agricultural, property, SME, and business funding programmes carry sector-specific risks including crop failure,
        property market fluctuations, and business insolvency. These risks are borne by cooperative participants.
      </p>

      <h2>Regulatory risk</h2>
      <p>
        Changes in Nigerian or UK financial regulation may affect product availability, member eligibility, or
        operational procedures. We will communicate material changes through the platform where practicable.
      </p>

      <h2>Your responsibility</h2>
      <p>
        You are responsible for evaluating whether any product suits your financial situation and risk tolerance. Seek
        independent professional advice if you are uncertain. Contact {COMPANY.supportEmail} with questions before
        committing funds.
      </p>
    </LegalDocument>
  );
}
