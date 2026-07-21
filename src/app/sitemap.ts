import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const baseUrl = (
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

const staticRoutes = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/pricing", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/services", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  {
    path: "/refund-policy",
    priority: 0.4,
    changeFrequency: "yearly" as const,
  },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map(
    ({ path, priority, changeFrequency }) => ({
      url: `${baseUrl}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    })
  );

  try {
    const [articles, services] = await Promise.all([
      db.article.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true, publishedAt: true },
        orderBy: { publishedAt: "desc" },
      }),
      db.service.findMany({
        where: { isActive: true },
        select: { id: true },
      }),
    ]);

    const dynamicEntries: MetadataRoute.Sitemap = [
      ...articles.map((article) => ({
        url: `${baseUrl}/blog/${article.slug}`,
        lastModified: article.updatedAt ?? article.publishedAt ?? now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...services.map((service) => ({
        url: `${baseUrl}/services/${service.id}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];

    return [...staticEntries, ...dynamicEntries];
  } catch (error) {
    console.error(
      "[sitemap] Failed to load dynamic routes from database:",
      error
    );
    return staticEntries;
  }
}
