import { buildMetadata } from "@/lib/seo";

/** Shared SEO for legal and policy pages. */
export function legalPageMetadata(title: string, path: string, description: string) {
  return buildMetadata({
    title: `${title} | Alto Rich`,
    description,
    path
  });
}

/** Member portal pages — not indexed. */
export function memberPageMetadata(title: string, path: string, description: string) {
  return buildMetadata({
    title: `${title} | Alto Rich`,
    description,
    path,
    noIndex: true
  });
}
