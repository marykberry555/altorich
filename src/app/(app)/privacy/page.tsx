import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { PrivacyCenterContent } from "@/components/trust/PrivacyCenterContent";
import { getSessionUser } from "@/lib/auth/session";
import { getUserServices } from "@/lib/services";
import { buildMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Center | Alto Rich",
  description: "Understand and manage your data, communication preferences, and privacy rights.",
  path: "/privacy"
});

export default async function PrivacyPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/privacy");

  const services = await getUserServices();
  const profile = services ? await services.profile.getProfile(user.id).catch(() => null) : null;
  const prefs = (profile?.notification_preferences ?? { in_app: true, email: true, sms: false }) as {
    in_app: boolean;
    email: boolean;
    sms: boolean;
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHero
        eyebrow="Privacy"
        title="Privacy Center"
        description="See what data we hold, manage notifications, and learn about your privacy rights."
      />
      <div className="mt-8">
        <PrivacyCenterContent
          profile={{
            fullName: profile?.full_name ?? "",
            emailVerified: Boolean(profile?.email_verified_at),
            phone: profile?.phone,
            notificationPrefs: prefs
          }}
        />
      </div>
    </div>
  );
}
