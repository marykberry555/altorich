import { LegalDocument } from "@/components/marketing/LegalDocument";
import { COMPANY } from "@/lib/company";
import { legalPageMetadata } from "@/lib/seo/page-metadata";

export const metadata = legalPageMetadata(
  "Security Policy",
  "/legal/security",
  "Platform security practices, financial controls, and member security responsibilities at Alto Rich."
);

export default function SecurityPage() {
  return (
    <LegalDocument title="Security Policy" lastUpdated="1 July 2025">
      <h2>1. Our approach</h2>
      <p>
        {COMPANY.brand} protects member funds and personal data through layered technical and operational controls.
        Security is not a feature — it is foundational to how {COMPANY.legalName} operates.
      </p>

      <h2>2. Platform security</h2>
      <ul>
        <li>Encrypted connections (HTTPS/TLS) for all web traffic</li>
        <li>Secure password hashing — we never store plain-text passwords</li>
        <li>Session management with automatic timeout on inactive sessions</li>
        <li>Role-based access controls for administrative functions</li>
        <li>Audit logging of sensitive account and wallet operations</li>
      </ul>

      <h2>3. Financial controls</h2>
      <ul>
        <li>Wallet balances are ledger-derived — no manual balance edits by members</li>
        <li>Deposits credited only after administrator verification of bank transfers</li>
        <li>Withdrawals processed to verified accounts in the member&apos;s name</li>
        <li>Dual-review procedures for high-value or flagged transactions</li>
      </ul>

      <h2>4. Infrastructure</h2>
      <p>
        Application and database infrastructure is hosted on enterprise-grade cloud providers with physical security,
        network isolation, and automated backups. Access to production systems is restricted to authorised personnel
        with multi-factor authentication.
      </p>

      <h2>5. Incident response</h2>
      <p>
        We maintain an incident response plan for security breaches, data leaks, and service disruptions. Affected
        members will be notified without undue delay where personal data is compromised, in accordance with applicable
        law.
      </p>

      <h2>6. Your responsibilities</h2>
      <ul>
        <li>Use a strong, unique password and do not share login credentials</li>
        <li>Log out on shared or public devices</li>
        <li>Verify you are on {COMPANY.domain} before entering credentials</li>
        <li>Report suspicious emails, messages, or account activity immediately to {COMPANY.supportEmail}</li>
      </ul>

      <h2>7. Reporting vulnerabilities</h2>
      <p>
        If you discover a security vulnerability, please report it responsibly to {COMPANY.supportEmail} with subject
        line &quot;Security Disclosure&quot;. Do not publicly disclose vulnerabilities before we have had reasonable time to
        investigate and remediate.
      </p>
    </LegalDocument>
  );
}
