import type { MetadataRoute } from "next";
import { indexingAllowed, siteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

// AI search and answer engines are welcomed by name: a crawler that matches its own group ignores the
// "*" group, so each one gets the same rules. Listing them keeps the archive citable if a zone-level
// default ever starts blocking unknown AI agents.
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
  "CCBot",
];

const DISALLOW = ["/admin", "/search"];

export default function robots(): MetadataRoute.Robots {
  // Staging/preview deployments (ALLOW_INDEXING != "true") are closed to crawlers.
  if (!indexingAllowed()) return { rules: { userAgent: "*", disallow: "/" } };
  const url = siteUrl();
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: DISALLOW },
    ],
    sitemap: `${url}/sitemap.xml`,
    host: url,
  };
}
