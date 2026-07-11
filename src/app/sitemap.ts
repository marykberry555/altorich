import type { MetadataRoute } from "next";
import { COMPANY } from "@/lib/company";
import { LEARN_ARTICLES } from "@/content/learn";

const staticRoutes = [
  "",
  "/about",
  "/contact",
  "/learn",
  "/learn/how-it-works",
  "/learn/faq",
  "/learn/glossary",
  "/packages",
  "/packages/starter",
  "/packages/growth",
  "/packages/premium",
  "/packages/elite",
  "/download",
  "/auth/login",
  "/auth/register",
  "/legal/terms",
  "/legal/privacy",
  "/legal/risk",
  "/legal/aml",
  "/legal/kyc",
  "/legal/cookies",
  "/legal/complaints"
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = COMPANY.siteUrl;
  const now = new Date();

  const educationArticles = LEARN_ARTICLES.filter((article) => article.slug !== "glossary");

  const pages = [
    ...staticRoutes.map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : path.startsWith("/packages") ? 0.9 : path.startsWith("/learn") ? 0.8 : 0.7
    })),
    ...educationArticles.map((article) => ({
      url: `${base}${article.path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.75
    }))
  ];

  return pages;
}
