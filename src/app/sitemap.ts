import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";
import { sitemapEntries } from "@/lib/queries/public";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = siteUrl();
  const { articles, authors, sections } = await sitemapEntries();
  const fixed = ["/", "/confindex/1", "/articles", "/authors", "/gallery", "/about", "/contact", "/director", "/advisory"];
  return [
    ...fixed.map((path) => ({ url: `${url}${path}`, changeFrequency: "monthly" as const, priority: path === "/" ? 1 : 0.7 })),
    ...sections.map((s) => ({ url: `${url}/innerindex/${s.id}`, lastModified: s.updatedAt, priority: 0.6 })),
    ...articles.map((a) => ({ url: `${url}/innermore/${a.id}`, lastModified: a.updatedAt, priority: 0.8 })),
    ...authors.map((a) => ({ url: `${url}/author/${a.id}`, lastModified: a.updatedAt, priority: 0.5 })),
  ];
}
