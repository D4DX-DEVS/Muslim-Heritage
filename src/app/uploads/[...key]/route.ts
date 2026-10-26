import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getEnv } from "@/lib/env";

// Serves R2 objects at their legacy path (/uploads/article/p51.jpg) so old image
// links keep working. Keys are immutable (replacing a file uploads a new key), so
// responses are cached at the edge with the Workers Cache API.

const SAFE_SEGMENT = /^[\w.\- ()]+$/;

function edgeCache(): Cache | null {
  // `caches.default` exists on Workers; absent in `next dev`.
  const c = (globalThis as { caches?: CacheStorage & { default?: Cache } }).caches;
  return c?.default ?? null;
}

export async function GET(request: Request, { params }: RouteContext<"/uploads/[...key]">): Promise<Response> {
  const { key: segments } = await params;
  let decoded: string[];
  try {
    decoded = segments.map((s) => decodeURIComponent(s));
  } catch {
    return new Response("Not found", { status: 404 });
  }
  if (decoded.length === 0 || decoded.some((s) => s === "." || s === ".." || !SAFE_SEGMENT.test(s))) {
    return new Response("Not found", { status: 404 });
  }
  const key = ["uploads", ...decoded].join("/");

  const cache = edgeCache();
  const cacheKey = new Request(new URL(request.url).origin + "/" + key);
  if (cache && !request.headers.has("if-none-match")) {
    const hit = await cache.match(cacheKey);
    if (hit) return hit;
  }

  const object = await getEnv().MEDIA.get(key, { onlyIf: request.headers });
  if (!object) return new Response("Not found", { status: 404, headers: { "cache-control": "public, max-age=60" } });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("x-content-type-options", "nosniff");
  // Never let an uploaded file render as a document on our origin.
  headers.set("content-security-policy", "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox");

  if (!("body" in object) || !object.body) {
    return new Response(null, { status: 304, headers });
  }
  const response = new Response(object.body, { headers });
  if (cache) getCloudflareContext().ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}
