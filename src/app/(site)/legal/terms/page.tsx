import { LegalDocument } from "@/components/marketing/LegalDocument";
import { COMPANY, REGULATORY_PLACEHOLDER } from "@/lib/company";
import { legalPageMetadata } from "@/lib/seo/page-metadata";

export const metadata = legalPageMetadata(
  "Terms of Service",
  "/legal/terms",
  "Membership rules, platform use, and cooperative participation terms for Alto Rich members."
);

export default function TermsPage() {
  return (
    <LegalDocument title="Terms of Service" lastUpdated="1 July 2025">
      <h2>1. Agreement</h2>
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use of the {COMPANY.brand} platform
        operated by {COMPANY.legalName} (Company No. {COMPANY.companyNumber}), registered at {COMPANY.addressFull}
        (&quot;AltoRich&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). By creating an account or using our services, you agree to
        these Terms.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 18 years old and legally capable of entering into binding contracts. Services are
        intended for verified members with valid Nigerian bank accounts unless otherwise stated for a specific product.
      </p>

      <h2>3. Account registration</h2>
      <p>
        You agree to provide accurate, current, and complete information during registration and to keep your profile
        updated. You are responsible for maintaining the confidentiality of your login credentials and for all
        activity under your account.
      </p>

      <h2>4. Cooperative products</h2>
      <p>
        Investment plans, savings products, and other offerings are structured as cooperative programmes. Projected
        figures displayed on the platform are estimates based on documented pool performance — they are not
        guaranteed returns. Actual distributions depend on verified earnings and admin-approved settlements.
      </p>

      <h2>5. Deposits and withdrawals</h2>
      <ul>
        <li>Deposits must be made to the active receiving account published in your dashboard.</li>
        <li>Wallet balances are updated only after administrator verification of bank credits.</li>
        <li>Withdrawals are processed during published windows (Mondays and Thursdays from 8:00 AM WAT).</li>
        <li>We may request additional verification before processing large or unusual transactions.</li>
      </ul>

      <h2>6. Prohibited conduct</h2>
      <p>You may not use the platform to launder money, commit fraud, misrepresent your identity, or circumvent KYC/AML controls. We reserve the right to suspend or terminate accounts that violate these Terms or applicable law.</p>

      <h2>7. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, {COMPANY.legalName} shall not be liable for indirect, incidental, or
        consequential damages arising from your use of the platform. Our total liability for any claim shall not exceed
        the fees paid by you to us in the twelve months preceding the claim.
      </p>

      <h2>8. Governing law</h2>
      <p>
        These Terms are governed by the laws of England and Wales. Disputes shall be subject to the exclusive
        jurisdiction of the courts of England and Wales, without prejudice to mandatory consumer protections applicable
        in Nigeria.
      </p>

      <h2>9. Regulatory disclosure</h2>
      <p>{REGULATORY_PLACEHOLDER}</p>

      <h2>10. Contact</h2>
      <p>
        Questions about these Terms: {COMPANY.supportEmail}. Postal address: {COMPANY.addressFull}.
      </p>
    </LegalDocument>
  );
}
