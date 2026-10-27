/**
 * Re-encodes every JPEG/PNG in the media library to WebP with sharp, so pages load lighter.
 *
 *   node scripts/media/to-webp.mts                    # local (.wrangler state, used by `next dev`)
 *   node scripts/media/to-webp.mts --dry-run          # report sizes, change nothing
 *   node --env-file=.env scripts/media/to-webp.mts --remote
 *       # real Cloudflare D1 (CLOUDFLARE_API_TOKEN) + R2 via its S3 API (same variables as the importer)
 *
 * For each image: writes `<key>.webp` next to the original in R2, points the media row at it
 * (every article, author, section and page references media by id, so they follow), and rewrites
 * inline `/<old key>` links in article, revision and page HTML. Originals stay in R2 so old links
 * keep working. Images where WebP isn't smaller are left alone. Safe to re-run.
 * Run it again after `migrate:import`, which re-creates the original JPEG rows.
 */
import { createHash } from "node:crypto";
import path from "node:path";
import { AwsClient } from "aws4fetch";
import sharp from "sharp";
import { getPlatformProxy } from "wrangler";
import { RestD1 } from "../migration/d1-rest.mts";

const ROOT = path.resolve(import.meta.dirname, "../..");
const remote = process.argv.includes("--remote");
const dryRun = process.argv.includes("--dry-run");

// Keep in step with src/lib/admin/to-webp.ts, which converts new uploads in the browser.
const MAX_WIDTH = 1920;
const QUALITY = 80;

interface MediaRow {
  id: number;
  key: string;
  filename: string;
  mime: string;
  bytes: number;
}

interface ObjectStore {
  get(key: string): Promise<Uint8Array | null>;
  put(key: string, bytes: Uint8Array, contentType: string, meta: Record<string, string>): Promise<void>;
}

function bindingStore(bucket: R2Bucket): ObjectStore {
  return {
    async get(key) {
      const object = await bucket.get(key);
      return object ? new Uint8Array(await object.arrayBuffer()) : null;
    },
    async put(key, bytes, contentType, meta) {
      await bucket.put(key, bytes, { httpMetadata: { contentType, cacheControl: "public, max-age=31536000, immutable" }, customMetadata: meta });
    },
  };
}

function remoteD1(): D1Database {
  const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, D1_DATABASE_ID } = process.env;
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN || !D1_DATABASE_ID) {
    throw new Error("Remote run needs CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN and D1_DATABASE_ID (use --env-file=.env).");
  }
  return new RestD1(CLOUDFLARE_ACCOUNT_ID, D1_DATABASE_ID, CLOUDFLARE_API_TOKEN) as unknown as D1Database;
}

function s3Store(): ObjectStore {
  const { R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env;
  if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    throw new Error("Remote run needs R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET_NAME (use --env-file=.env).");
  }
  const client = new AwsClient({ accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY, service: "s3", region: "auto" });
  const base = `${R2_ENDPOINT.replace(/\/$/, "")}/${R2_BUCKET_NAME}`;
  const url = (key: string) => `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;
  return {
    async get(key) {
      const res = await client.fetch(url(key));
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`R2 GET ${key} failed: ${res.status}`);
      return new Uint8Array(await res.arrayBuffer());
    },
    async put(key, bytes, contentType, meta) {
      const headers: Record<string, string> = { "content-type": contentType, "cache-control": "public, max-age=31536000, immutable" };
      for (const [k, v] of Object.entries(meta)) headers[`x-amz-meta-${k.toLowerCase()}`] = v;
      const res = await client.fetch(url(key), { method: "PUT", body: bytes as Uint8Array<ArrayBuffer>, headers });
      if (!res.ok) throw new Error(`R2 PUT ${key} failed: ${res.status} ${await res.text()}`);
    },
  };
}

const webpKey = (key: string) => key.replace(/\.(jpe?g|png)$/i, "") + ".webp";
const kb = (n: number) => `${(n / 1024).toFixed(0)} KB`;

async function main(): Promise<void> {
  const proxy = remote ? null : await getPlatformProxy<{ DB: D1Database; MEDIA: R2Bucket }>({ configPath: path.join(ROOT, "wrangler.jsonc"), persist: true });
  const db = proxy ? proxy.env.DB : remoteD1();
  const store = proxy ? bindingStore(proxy.env.MEDIA) : s3Store();

  const { results: rows } = await db
    .prepare("SELECT id, key, filename, mime, bytes FROM media WHERE mime IN ('image/jpeg', 'image/png') ORDER BY id")
    .all<MediaRow>();
  console.log(`${remote ? "remote" : "local"}${dryRun ? " (dry run)" : ""}: ${rows.length} JPEG/PNG images`);

  let converted = 0;
  let skipped = 0;
  let before = 0;
  let after = 0;
  const failures: string[] = [];

  for (const row of rows) {
    try {
      const original = await store.get(row.key);
      if (!original) {
        failures.push(`${row.key}: missing in R2`);
        continue;
      }
      const { data, info } = await sharp(original)
        .rotate()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: QUALITY, effort: 5 })
        .toBuffer({ resolveWithObject: true });
      if (data.byteLength >= original.byteLength) {
        skipped++;
        continue;
      }
      before += original.byteLength;
      after += data.byteLength;
      converted++;
      if (dryRun) continue;

      const key = webpKey(row.key);
      const sha256 = createHash("sha256").update(data).digest("hex");
      await store.put(key, new Uint8Array(data), "image/webp", { sha256, convertedFrom: row.key });
      await db
        .prepare("UPDATE media SET key = ?, filename = ?, mime = 'image/webp', bytes = ?, width = ?, height = ?, sha256 = ?, updated_at = ? WHERE id = ?")
        .bind(key, path.posix.basename(key), data.byteLength, info.width, info.height, sha256, new Date().toISOString(), row.id)
        .run();
      const from = `/${row.key}`;
      const to = `/${key}`;
      for (const table of ["articles", "article_revisions", "pages"]) {
        await db.prepare(`UPDATE ${table} SET body_html = REPLACE(body_html, ?, ?) WHERE instr(body_html, ?) > 0`).bind(from, to, from).run();
      }
    } catch (e) {
      failures.push(`${row.key}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  console.log(`converted ${converted}, left as is ${skipped} (WebP not smaller), failed ${failures.length}`);
  if (converted) console.log(`size of converted images: ${kb(before)} -> ${kb(after)} (${Math.round((1 - after / before) * 100)}% smaller)`);
  for (const f of failures) console.log(`  ! ${f}`);
  await proxy?.dispose();
  if (failures.length) process.exitCode = 1;
}

await main();
