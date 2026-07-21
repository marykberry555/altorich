import { LegalDocument } from "@/components/marketing/LegalDocument";
import { RiskDisclosureContent } from "@/components/trust/RiskDisclosureContent";
import { legalPageMetadata } from "@/lib/seo/page-metadata";

export const metadata = legalPageMetadata(
  "Risk Disclosure",
  "/legal/risk",
  "Investment risks, market uncertainty, member responsibilities, and fraud awareness for Alto Rich cooperative products."
);

export default function RiskPage() {
  return (
    <LegalDocument title="Risk Disclosure" lastUpdated="1 July 2025">
      <RiskDisclosureContent />
    </LegalDocument>
  );
}
