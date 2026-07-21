import { LegalDocument } from "@/components/marketing/LegalDocument";
import { COMPANY } from "@/lib/company";
import { legalPageMetadata } from "@/lib/seo/page-metadata";

export const metadata = legalPageMetadata(
  "Complaints Procedure",
  "/legal/complaints",
  "How to raise a complaint with Alto Rich and what to expect from our resolution process."
);

export default function ComplaintsPage() {
  return (
    <LegalDocument title="Complaints Procedure" lastUpdated="1 July 2025">
      <h2>1. Our commitment</h2>
      <p>
        {COMPANY.legalName} takes member complaints seriously. If something has gone wrong with your {COMPANY.brand}
        account, deposit, withdrawal, or service experience, we want to hear from you and resolve it fairly.
      </p>

      <h2>2. How to lodge a complaint</h2>
      <p>Contact us with the following details:</p>
      <ul>
        <li>Your full name and registered email or phone number</li>
        <li>Account reference or transaction ID (if applicable)</li>
        <li>Clear description of the issue and desired outcome</li>
        <li>Supporting evidence (e.g. bank transfer receipt, screenshots)</li>
      </ul>
      <p>
        Email: {COMPANY.supportEmail} with subject line &quot;Formal Complaint&quot;.
        <br />
        Postal: {COMPANY.addressFull}
      </p>

      <h2>3. Acknowledgement</h2>
      <p>
        We aim to acknowledge all complaints within two business days of receipt. Acknowledgement confirms your
        complaint is logged and assigned for investigation.
      </p>

      <h2>4. Investigation and resolution</h2>
      <p>
        Our operations team will investigate and respond within 15 business days. Complex cases involving third-party
        banks or regulatory matters may require additional time — we will keep you informed of progress.
      </p>

      <h2>5. Escalation</h2>
      <p>
        If you are dissatisfied with our initial response, you may request escalation to senior management by replying
        to your case reference with &quot;Escalation Request&quot;. Escalated complaints receive a final written response within
        10 additional business days.
      </p>

      <h2>6. External resolution</h2>
      <p>
        If your complaint remains unresolved after our internal process, you may have rights to refer the matter to an
        applicable ombudsman or regulatory body depending on your jurisdiction and the nature of the dispute. We will
        provide relevant contact details where applicable.
      </p>

      <h2>7. Record keeping</h2>
      <p>
        Complaints and resolutions are logged and reviewed periodically to identify systemic issues and improve our
        service for Nigerian members.
      </p>
    </LegalDocument>
  );
}
