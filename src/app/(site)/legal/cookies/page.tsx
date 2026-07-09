import { LegalDocument } from "@/components/marketing/LegalDocument";
import { COMPANY } from "@/lib/company";

export default function CookiesPage() {
  return (
    <LegalDocument title="Cookie Policy" lastUpdated="1 July 2025">
      <h2>1. What are cookies?</h2>
      <p>
        Cookies are small text files stored on your device when you visit {COMPANY.domain}. They help the {COMPANY.brand}
        website and member platform function correctly, remember your preferences, and understand how visitors use our
        services.
      </p>

      <h2>2. Cookies we use</h2>
      <ul>
        <li>
          <strong>Essential cookies:</strong> Required for authentication, session management, and security. The platform
          cannot function without these.
        </li>
        <li>
          <strong>Functional cookies:</strong> Remember your preferences such as language and display settings.
        </li>
        <li>
          <strong>Analytics cookies:</strong> Help us understand page visits and feature usage so we can improve
          performance on Nigerian networks and devices.
        </li>
      </ul>

      <h2>3. Third-party cookies</h2>
      <p>
        We may use third-party services (e.g. authentication providers, analytics) that set their own cookies. These
        providers are bound by their respective privacy policies.
      </p>

      <h2>4. Managing cookies</h2>
      <p>
        You can control cookies through your browser settings. Blocking essential cookies may prevent you from logging
        in or using core platform features. Most browsers allow you to delete existing cookies and set preferences for
        future visits.
      </p>

      <h2>5. Updates</h2>
      <p>
        We may update this Cookie Policy to reflect changes in technology or regulation. Material changes will be
        indicated by updating the &quot;Last updated&quot; date above.
      </p>

      <h2>6. Contact</h2>
      <p>Questions: {COMPANY.supportEmail}</p>
    </LegalDocument>
  );
}
