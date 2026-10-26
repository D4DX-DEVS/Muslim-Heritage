import "server-only";
import { getEnv } from "@/lib/env";

// Stored content always references media as /uploads/...; when a public CDN origin
// for the R2 bucket is configured, URLs are pointed at it at render time.

function base(): string {
  return (getEnv().MEDIA_BASE_URL ?? "").trim().replace(/\/$/, "");
}

export function mediaUrl(key: string): string {
  return `${base()}/${key}`;
}

export function withMediaBase(html: string): string {
  const b = base();
  return b ? html.replace(/(\ssrc=")\/uploads\//g, `$1${b}/uploads/`) : html;
}
