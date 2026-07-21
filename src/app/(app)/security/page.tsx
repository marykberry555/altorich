import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { MemberSecurityCenter } from "@/components/trust/MemberSecurityCenter";
import { getSessionUser } from "@/lib/auth/session";
import { getAuthService } from "@/lib/auth/service";
import { getServiceRoleServices } from "@/lib/services";
import { MemberSecurityService } from "@/services/member/member-security.service";
import { buildMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

export const metadata: Metadata = buildMetadata({
  title: "Security Center | Alto Rich",
  description: "Review verification status, login activity, trusted devices, and account security.",
  path: "/security"
});

export default async function MemberSecurityPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/security");

  const services = await getServiceRoleServices();
  const auth = await getAuthService();
  if (!services) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHero eyebrow="Security" title="Security Center" description="Security services are temporarily unavailable." />
      </div>
    );
  }

  const [snapshot, trustedDevices] = await Promise.all([
    new MemberSecurityService(services.supabase).getSnapshot(user.id),
    auth.listTrustedDevices(user.id).catch(() => [])
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHero
        eyebrow="Security"
        title="Security Center"
        description="Monitor sign-ins, manage trusted devices, and review account activity."
      />
      <div className="mt-8">
        <MemberSecurityCenter snapshot={snapshot} trustedDevices={trustedDevices} />
      </div>
    </div>
  );
}
