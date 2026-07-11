import { HomePage } from "@/components/marketing/HomePage";
import { buildMetadata, SOCIAL_SHARE_TITLE } from "@/lib/seo";

export const metadata = buildMetadata({
  title: SOCIAL_SHARE_TITLE,
  description: "",
  path: "/"
});

export default function Page() {
  return <HomePage />;
}
