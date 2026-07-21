import { DownloadPageContent } from "@/components/marketing/DownloadPageContent";
import { buildMetadata } from "@/lib/seo";
import { downloadMeta } from "@/content/download";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = buildMetadata({
  title: downloadMeta.title,
  description: downloadMeta.description,
  path: "/download"
});

export default function DownloadPage() {
  return <DownloadPageContent />;
}
