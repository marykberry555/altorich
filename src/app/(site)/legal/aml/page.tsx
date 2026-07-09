import { LegalDocument } from "@/components/marketing/LegalDocument";
import { COMPANY } from "@/lib/company";

export default function AmlPage() {
  return (
    <LegalDocument title="Anti-Money Laundering Policy" lastUpdated="1 July 2025">
      <h2>1. Purpose</h2>
      <p>
        {COMPANY.legalName} is committed to preventing money laundering, terrorist financing, and other financial crime.
        This Anti-Money Laundering (&quot;AML&quot;) Policy sets out the controls applied across the {COMPANY.brand} platform.
      </p>

      <h2>2. Scope</h2>
      <p>
        This policy applies to all members, employees, contractors, and third-party service providers involved in
        onboarding, deposit verification, withdrawal processing, and account monitoring.
      </p>

      <h2>3. Customer due diligence</h2>
      <ul>
        <li>Identity verification for all members before full platform access</li>
        <li>Verification of Nigerian bank account ownership for withdrawals</li>
        <li>Enhanced due diligence for high-value transactions and PEPs (Politically Exposed Persons)</li>
        <li>Ongoing monitoring of account activity against expected patterns</li>
      </ul>

      <h2>4. Transaction monitoring</h2>
      <p>
        All deposits must originate from verified bank transfers matched against our receiving accounts. Withdrawals are
        processed only to accounts in the member&apos;s name. We flag and investigate:
      </p>
      <ul>
        <li>Structuring or splitting transactions to avoid thresholds</li>
        <li>Rapid deposit-withdrawal cycles without legitimate product participation</li>
        <li>Mismatched payer names or unexplained third-party transfers</li>
        <li>Activity from high-risk jurisdictions without adequate explanation</li>
      </ul>

      <h2>5. Reporting</h2>
      <p>
        Where required by law, suspicious activity reports are filed with the relevant Financial Intelligence Unit or
        competent authority. Members will not be notified of such reports where prohibited by law.
      </p>

      <h2>6. Record keeping</h2>
      <p>
        KYC documentation, transaction records, and investigation files are retained for a minimum of five years from
        the end of the business relationship or transaction date, or longer if required by regulation.
      </p>

      <h2>7. Training and governance</h2>
      <p>
        Staff with AML responsibilities receive periodic training. The Director oversees AML compliance and reviews this
        policy at least annually.
      </p>

      <h2>8. Contact</h2>
      <p>
        Report suspected financial crime or AML concerns to {COMPANY.supportEmail} with subject line &quot;AML Report&quot;.
      </p>
    </LegalDocument>
  );
}
