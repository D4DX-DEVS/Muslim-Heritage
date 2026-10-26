import type { MetadataRoute } from "next";
import { indexingAllowed, siteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  // Staging/preview deployments (ALLOW_INDEXING != "true") are closed to crawlers.
  if (!indexingAllowed()) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/search"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
