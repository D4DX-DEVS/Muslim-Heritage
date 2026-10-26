import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface AppEnv {
  DB: D1Database;
  MEDIA: R2Bucket;
  SITE_URL?: string;
  ALLOW_INDEXING?: string;
  MEDIA_BASE_URL?: string;
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD_HASH?: string;
  SESSION_SECRET?: string;
}

export function getEnv(): AppEnv {
  return getCloudflareContext().env as unknown as AppEnv;
}

export function siteUrl(): string {
  const url = getEnv().SITE_URL || process.env.SITE_URL || "https://www.muslimheritage.in";
  return url.replace(/\/$/, "");
}

export function indexingAllowed(): boolean {
  return getEnv().ALLOW_INDEXING === "true";
}
