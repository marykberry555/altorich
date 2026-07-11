import type { MetadataRoute } from "next";

/** Sitemap disabled — site is not indexed or discoverable via search. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [];
}
