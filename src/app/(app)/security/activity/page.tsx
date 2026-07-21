import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/marketing/PageHero";
import { SecurityTimelinePanel } from "@/components/trust/SecurityTimelinePanel";
import { Button } from "@/components/ui/Button";
import { getSessionUser } from "@/lib/auth/session";
import { getServiceRoleServices } from "@/lib/services";
import { MemberSecurityService } from "@/services/member/member-security.service";
import { buildMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

export const metadata: Metadata = buildMetadata({
  title: "Account Activity | Alto Rich",
  description: "Full security and account activity timeline with search and filters.",
  path: "/security/activity"
});

export default async function SecurityActivityPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/security/activity");

  const services = await getServiceRoleServices();
  if (!services) redirect("/security");

  const snapshot = await new MemberSecurityService(services.supabase).getSnapshot(user.id);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHero
        eyebrow="Security"
        title="Account activity timeline"
        description="Authentication, profile changes, investments, withdrawals, and notices."
      />
      <div className="mt-8 space-y-4">
        <SecurityTimelinePanel events={snapshot.timeline} exportHref="/api/member/statements/transactions" />
        <Link href="/security">
          <Button variant="outline">Back to Security Center</Button>
        </Link>
      </div>
    </div>
  );
}
