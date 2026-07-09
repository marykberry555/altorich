import { LegalDocument } from "@/components/marketing/LegalDocument";
import { COMPANY } from "@/lib/company";

export default function PrivacyPage() {
  return (
    <LegalDocument title="Privacy Policy" lastUpdated="1 July 2025">
      <h2>1. Data controller</h2>
      <p>
        {COMPANY.legalName} (Company No. {COMPANY.companyNumber}), {COMPANY.addressFull}, is the data controller for
        personal information collected through {COMPANY.domain} and the {COMPANY.brand} member platform.
      </p>

      <h2>2. Information we collect</h2>
      <ul>
        <li><strong>Account data:</strong> name, email, phone number, password hash, and profile details.</li>
        <li><strong>Financial data:</strong> bank account details, deposit references, withdrawal requests, and wallet transaction history.</li>
        <li><strong>Identity data:</strong> KYC documents submitted for verification (e.g. government ID, proof of address).</li>
        <li><strong>Technical data:</strong> IP address, device type, browser, and usage logs for security and fraud prevention.</li>
      </ul>

      <h2>3. How we use your information</h2>
      <p>We process personal data to:</p>
      <ul>
        <li>Provide and maintain your member account and wallet ledger</li>
        <li>Verify bank transfers and process withdrawals</li>
        <li>Comply with KYC, AML, and regulatory obligations</li>
        <li>Communicate service updates, security alerts, and support responses</li>
        <li>Improve platform security and detect fraudulent activity</li>
      </ul>

      <h2>4. Legal basis</h2>
      <p>
        Processing is based on contract performance (providing services you request), legal obligations (AML/KYC
        compliance), and legitimate interests (fraud prevention and platform security). Where required, we obtain your
        consent for marketing communications.
      </p>

      <h2>5. Data sharing</h2>
      <p>
        We do not sell your personal data. We may share information with payment processors, identity verification
        providers, cloud infrastructure hosts, and regulators or law enforcement when legally required.
      </p>

      <h2>6. International transfers</h2>
      <p>
        Data may be processed in the United Kingdom and other jurisdictions where our service providers operate.
        Appropriate safeguards are applied for cross-border transfers in accordance with applicable data protection law.
      </p>

      <h2>7. Retention</h2>
      <p>
        We retain account and transaction records for as long as your account is active and for a minimum period
        required by financial regulations and tax law thereafter.
      </p>

      <h2>8. Your rights</h2>
      <p>
        Depending on your jurisdiction, you may have rights to access, correct, delete, or restrict processing of your
        personal data, and to lodge a complaint with a supervisory authority. Contact {COMPANY.supportEmail} to exercise
        these rights.
      </p>

      <h2>9. Security</h2>
      <p>
        We implement technical and organisational measures to protect your data. See our{" "}
        <a href="/legal/security">Security Policy</a> for details.
      </p>
    </LegalDocument>
  );
}
