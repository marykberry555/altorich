import { HomePage } from "@/components/marketing/HomePage";
import { DEFAULT_HOMEPAGE_STATS } from "@/lib/homepage/homepage-stats";
import { buildMetadata, SOCIAL_SHARE_TITLE } from "@/lib/seo";
import { getServiceRoleServices } from "@/lib/services";

export const metadata = buildMetadata({
  title: SOCIAL_SHARE_TITLE,
  description: "",
  path: "/"
});

export const dynamic = "force-dynamic";

export default async function Page() {
  const services = await getServiceRoleServices();
  const homepageStats = services
    ? await services.settings.getHomepageStats()
    : DEFAULT_HOMEPAGE_STATS;

  return <HomePage homepageStats={homepageStats} />;
}
