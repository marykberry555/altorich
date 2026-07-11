import type { MetadataRoute } from "next";

/** Disallow all crawlers — private site, link-only discovery. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/"
    }
  };
}
