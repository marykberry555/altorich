import { LegalDocument } from "@/components/marketing/LegalDocument";
import { COMPANY } from "@/lib/company";
import { legalPageMetadata } from "@/lib/seo/page-metadata";

export const metadata = legalPageMetadata(
  "Know Your Customer Policy",
  "/legal/kyc",
  "Identity verification requirements and document standards for Alto Rich members."
);

export default function KycPage() {
  return (
    <LegalDocument title="Know Your Customer Policy" lastUpdated="1 July 2025">
      <h2>1. Overview</h2>
      <p>
        {COMPANY.brand}, operated by {COMPANY.legalName}, implements Know Your Customer (&quot;KYC&quot;) procedures to verify
        member identity, prevent fraud, and comply with anti-money laundering obligations.
      </p>

      <h2>2. Standard verification</h2>
      <p>All members must complete:</p>
      <ul>
        <li>Registration with a valid email address</li>
        <li>Phone number verification via one-time password (OTP)</li>
        <li>Accurate personal profile (full legal name, date of birth, address)</li>
        <li>Valid Nigerian bank account for deposits and withdrawals</li>
      </ul>

      <h2>3. Enhanced verification</h2>
      <p>Additional documentation may be required for:</p>
      <ul>
        <li>Higher-tier investment or savings products</li>
        <li>SME, agriculture, or business funding programmes</li>
        <li>Large or unusual transaction volumes</li>
        <li>Accounts flagged during routine monitoring</li>
      </ul>
      <p>Enhanced documents may include government-issued photo ID, proof of address, and business registration (CAC) for corporate applicants.</p>

      <h2>4. Verification process</h2>
      <p>
        Documents are reviewed by our operations team. Verification timelines vary but typically complete within 1–3
        business days. You will be notified of approval, rejection, or requests for additional information via your
        dashboard or registered email.
      </p>

      <h2>5. Ongoing monitoring</h2>
      <p>
        KYC is not a one-time event. We may request updated documents if your details change, if regulatory
        requirements evolve, or if account activity warrants re-verification.
      </p>

      <h2>6. Data protection</h2>
      <p>
        KYC documents are stored securely and processed in accordance with our{" "}
        <a href="/legal/privacy">Privacy Policy</a>. Access is restricted to authorised personnel.
      </p>

      <h2>7. Consequences of non-compliance</h2>
      <p>
        Failure to complete KYC or provide requested documentation may result in restricted account access, suspended
        withdrawals, or account closure in accordance with our Terms of Service.
      </p>

      <h2>8. Contact</h2>
      <p>KYC enquiries: {COMPANY.supportEmail}</p>
    </LegalDocument>
  );
}
