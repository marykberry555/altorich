import { DownloadPageContent } from "@/components/marketing/DownloadPageContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { downloadMeta } from "@/content/download";

export const metadata = buildMetadata({
  title: downloadMeta.title,
  description: downloadMeta.description,
  path: "/download"
});

export default function DownloadPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Download", path: "/download" }])} />
      <DownloadPageContent />
    </>
  );
}
