/**
 * Idempotent import of extracted legacy content into D1 + R2.
 *
 *   node scripts/migration/import.mts            # local (.wrangler state, used by `next dev`)
 *   node --env-file=.env scripts/migration/import.mts --remote
 *       # real Cloudflare D1 (CLOUDFLARE_API_TOKEN) + R2 via its S3 API
 *       # (R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME)
 *   node scripts/migration/import.mts --force    # overwrite rows already in the DB (discards admin edits!)
 *
 * Re-running never duplicates: media upserts by key, content rows by legacy id.
 * Without --force, existing content rows are left untouched so CMS edits survive.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { AwsClient } from "aws4fetch";
import { getPlatformProxy } from "wrangler";
import { sanitizeArticleHtml } from "../../src/lib/content/sanitize.ts";
import { htmlToText, readingMinutes, summarize } from "../../src/lib/content/text.ts";
import { indexArticleStatements } from "../../src/lib/search-core.ts";
import { RestD1 } from "./d1-rest.mts";

const ROOT = path.resolve(import.meta.dirname, "../..");
const DATA = path.join(ROOT, "migration/data");
const MEDIA_DIR = path.join(ROOT, "migration/media");
const remote = process.argv.includes("--remote");
const force = process.argv.includes("--force");

interface ManifestEntry {
  legacy_url: string;
  key: string;
  kind: string;
  status: "downloaded" | "failed";
  bytes?: number;
  sha256?: string;
  mime?: string;
  width?: number | null;
  height?: number | null;
  error?: string;
}
interface LegacyArticle {
  legacy_id: number;
  legacy_url: string;
  title: string;
  byline: string;
  author_ids: number[];
  body_html: string;
  lead_image: string | null;
  thumbnail?: string;
  section_ids: number[];
  featured_order: number | null;
}
interface LegacyAuthor {
  legacy_id: number;
  name: string;
  designation: string;
  bio: string;
  photo: string | null;
}
interface LegacySection {
  legacy_id: number;
  title: string;
  sort_order: number;
  image: string | null;
  article_ids: number[];
}
interface Content {
  conference: { legacy_id: number; title: string; subtitle: string; slides: string[]; gallery: string[] };
  sections: LegacySection[];
  articles: LegacyArticle[];
  authors: LegacyAuthor[];
  board_members: { board: "director" | "advisory"; role: string; name: string }[];
  pages: Record<string, { slug: string; title: string; heading?: string; body_html?: string; lines?: string[] }>;
}

const readJson = async <T,>(file: string): Promise<T> => JSON.parse(await readFile(path.join(DATA, file), "utf8")) as T;

interface ObjectStore {
  sha256Of(key: string): Promise<string | null>;
  put(key: string, bytes: Uint8Array, contentType: string, meta: Record<string, string>): Promise<void>;
}

function bindingStore(bucket: R2Bucket): ObjectStore {
  return {
    async sha256Of(key) {
      const head = await bucket.head(key);
      return head ? head.customMetadata?.sha256 ?? "" : null;
    },
    async put(key, bytes, contentType, meta) {
      await bucket.put(key, bytes, { httpMetadata: { contentType, cacheControl: "public, max-age=31536000, immutable" }, customMetadata: meta });
    },
  };
}

function remoteD1(): D1Database {
  const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, D1_DATABASE_ID } = process.env;
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN || !D1_DATABASE_ID) {
    throw new Error("Remote import needs CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN and D1_DATABASE_ID (use --env-file=.env).");
  }
  return new RestD1(CLOUDFLARE_ACCOUNT_ID, D1_DATABASE_ID, CLOUDFLARE_API_TOKEN) as unknown as D1Database;
}

function s3Store(): ObjectStore {
  const { R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env;
  if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    throw new Error("Remote import needs R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET_NAME (use --env-file=.env).");
  }
  const client = new AwsClient({ accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY, service: "s3", region: "auto" });
  const base = `${R2_ENDPOINT.replace(/\/$/, "")}/${R2_BUCKET_NAME}`;
  const url = (key: string) => `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;
  return {
    async sha256Of(key) {
      const res = await client.fetch(url(key), { method: "HEAD" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`R2 HEAD ${key} failed: ${res.status}`);
      return res.headers.get("x-amz-meta-sha256") ?? "";
    },
    async put(key, bytes, contentType, meta) {
      const headers: Record<string, string> = { "content-type": contentType, "cache-control": "public, max-age=31536000, immutable" };
      for (const [k, v] of Object.entries(meta)) headers[`x-amz-meta-${k.toLowerCase()}`] = v;
      const res = await client.fetch(url(key), { method: "PUT", body: bytes as Uint8Array<ArrayBuffer>, headers });
      if (!res.ok) throw new Error(`R2 PUT ${key} failed: ${res.status} ${await res.text()}`);
    },
  };
}

async function main(): Promise<void> {
  const content = await readJson<Content>("content.json");
  const manifest = await readJson<ManifestEntry[]>("media-manifest.json");
  const inventory = (await readFile(path.join(DATA, "inventory.csv"), "utf8")).trim().split(/\r?\n/).slice(1);

  // Local: Miniflare state shared with `next dev`. Remote: D1 REST API + R2 S3 API.
  const proxy = remote ? null : await getPlatformProxy<{ DB: D1Database; MEDIA: R2Bucket }>({ configPath: path.join(ROOT, "wrangler.jsonc"), persist: true });
  const db = proxy ? proxy.env.DB : remoteD1();
  const store = proxy ? bindingStore(proxy.env.MEDIA) : s3Store();
  const onConflict = force ? "DO UPDATE SET" : "DO NOTHING";
  const report: Record<string, unknown> = { mode: remote ? "remote" : "local", force, startedAt: new Date().toISOString() };
  const problems: string[] = [];

  // ------------------------------------------------------------ media → R2 + D1
  let uploaded = 0;
  let unchanged = 0;
  const mediaStmts: D1PreparedStatement[] = [];
  for (const m of manifest) {
    if (!m.key.startsWith("uploads/")) continue; // site chrome lives in /public/images
    if (m.status !== "downloaded") {
      problems.push(`media not downloaded: ${m.legacy_url} (${m.error})`);
      continue;
    }
    if ((await store.sha256Of(m.key)) === m.sha256) {
      unchanged++;
    } else {
      const bytes = await readFile(path.join(MEDIA_DIR, m.key));
      await store.put(m.key, bytes, m.mime ?? "application/octet-stream", { sha256: m.sha256 ?? "", legacyurl: m.legacy_url });
      uploaded++;
    }
    mediaStmts.push(
      db
        .prepare(
          `INSERT INTO media (key, legacy_url, filename, mime, bytes, width, height, sha256)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
           ON CONFLICT(key) DO UPDATE SET legacy_url = excluded.legacy_url, mime = excluded.mime,
             bytes = excluded.bytes, width = excluded.width, height = excluded.height, sha256 = excluded.sha256`,
        )
        .bind(m.key, m.legacy_url, path.posix.basename(m.key), m.mime, m.bytes, m.width ?? null, m.height ?? null, m.sha256),
    );
  }
  await db.batch(mediaStmts);
  const mediaRows = (await db.prepare("SELECT id, key, legacy_url FROM media").all<{ id: number; key: string; legacy_url: string | null }>()).results;
  const mediaId = new Map<string, number>();
  for (const r of mediaRows) if (r.legacy_url) mediaId.set(r.legacy_url, r.id);
  const idFor = (url: string | null | undefined): number | null => (url ? mediaId.get(url) ?? null : null);
  report.media = { uploaded, unchangedInR2: unchanged, rows: mediaRows.length };

  // ------------------------------------------------------------ conference
  const conf = content.conference;
  await db.batch([
    db
      .prepare(
        `INSERT INTO conferences (id, title, subtitle) VALUES (?1, ?2, ?3)
         ON CONFLICT(id) ${force ? "DO UPDATE SET title = excluded.title, subtitle = excluded.subtitle" : onConflict}`,
      )
      .bind(conf.legacy_id, conf.title, conf.subtitle),
  ]);
  const existingConfMedia = await db.prepare("SELECT count(*) AS n FROM conference_media WHERE conference_id = ?1").bind(conf.legacy_id).first<{ n: number }>();
  if (force || !existingConfMedia?.n) {
    const stmts = [db.prepare("DELETE FROM conference_media WHERE conference_id = ?1").bind(conf.legacy_id)];
    const add = (urls: string[], kind: string) =>
      urls.forEach((u, i) => {
        const id = idFor(u);
        if (id == null) problems.push(`conference ${kind} image missing: ${u}`);
        else stmts.push(db.prepare("INSERT INTO conference_media (conference_id, media_id, kind, sort_order) VALUES (?1, ?2, ?3, ?4)").bind(conf.legacy_id, id, kind, i));
      });
    add(conf.slides, "slide");
    add(conf.gallery, "gallery");
    await db.batch(stmts);
  }

  // ------------------------------------------------------------ sections
  await db.batch(
    content.sections.map((s) =>
      db
        .prepare(
          `INSERT INTO sections (id, conference_id, title, image_id, sort_order) VALUES (?1, ?2, ?3, ?4, ?5)
           ON CONFLICT(id) ${force ? "DO UPDATE SET title = excluded.title, image_id = excluded.image_id, sort_order = excluded.sort_order" : onConflict}`,
        )
        .bind(s.legacy_id, conf.legacy_id, s.title, idFor(s.image), s.sort_order),
    ),
  );

  // ------------------------------------------------------------ authors
  await db.batch(
    content.authors.map((a) =>
      db
        .prepare(
          `INSERT INTO authors (id, name, designation, bio, photo_id) VALUES (?1, ?2, ?3, ?4, ?5)
           ON CONFLICT(id) ${force ? "DO UPDATE SET name = excluded.name, designation = excluded.designation, bio = excluded.bio, photo_id = excluded.photo_id" : onConflict}`,
        )
        .bind(a.legacy_id, a.name.normalize("NFC"), a.designation.normalize("NFC"), a.bio, idFor(a.photo)),
    ),
  );
  const authorIds = new Set(content.authors.map((a) => a.legacy_id));

  // ------------------------------------------------------------ articles
  const sortInSection = new Map<number, number>();
  for (const s of content.sections) s.article_ids.forEach((id, i) => sortInSection.set(id, i));
  let leadImagesLifted = 0;
  const articleStmts: D1PreparedStatement[] = [];
  for (const a of content.articles) {
    let body = sanitizeArticleHtml(a.body_html.normalize("NFC"));
    // The legacy layout put the lead image as the body's first element; it is shown
    // as the article's featured image instead, so lift it out to avoid a duplicate.
    const leadPath = a.lead_image?.replace(/^https?:\/\/(www\.)?muslimheritage\.in/, "");
    if (leadPath) {
      const lifted = body.replace(new RegExp(`^(<p>)?\\s*<img src="${leadPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>\\s*`), "$1");
      if (lifted !== body) {
        body = lifted.replace(/^<p>\s*<\/p>/, "");
        leadImagesLifted++;
      }
    }
    const text = htmlToText(body);
    if (!text) problems.push(`article ${a.legacy_id} has empty body after sanitising`);
    const sectionId = a.section_ids[0] ?? null;
    const values = [
      a.legacy_id,
      a.title.normalize("NFC"),
      summarize(text),
      body,
      sectionId,
      conf.legacy_id,
      idFor(a.lead_image),
      idFor(a.thumbnail) ?? idFor(a.lead_image),
      a.featured_order,
      sortInSection.get(a.legacy_id) ?? 0,
      readingMinutes(text),
    ];
    articleStmts.push(
      db
        .prepare(
          `INSERT INTO articles (id, title, summary, body_html, section_id, conference_id, lead_image_id, thumbnail_id,
             status, featured_order, sort_order, reading_minutes)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'published', ?9, ?10, ?11)
           ON CONFLICT(id) ${
             force
               ? `DO UPDATE SET title = excluded.title, summary = excluded.summary, body_html = excluded.body_html,
                  section_id = excluded.section_id, lead_image_id = excluded.lead_image_id, thumbnail_id = excluded.thumbnail_id,
                  featured_order = excluded.featured_order, sort_order = excluded.sort_order, reading_minutes = excluded.reading_minutes,
                  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')`
               : onConflict
           }`,
        )
        .bind(...values),
    );
    a.author_ids.forEach((authorId, position) => {
      if (!authorIds.has(authorId)) {
        problems.push(`article ${a.legacy_id} references missing author ${authorId}`);
        return;
      }
      articleStmts.push(
        db.prepare("INSERT INTO article_authors (article_id, author_id, position) VALUES (?1, ?2, ?3) ON CONFLICT DO NOTHING").bind(a.legacy_id, authorId, position),
      );
    });
  }
  for (let i = 0; i < articleStmts.length; i += 50) await db.batch(articleStmts.slice(i, i + 50));
  report.leadImagesLiftedFromBody = leadImagesLifted;

  // ------------------------------------------------------------ boards + pages
  for (const board of ["director", "advisory"] as const) {
    const existing = await db.prepare("SELECT count(*) AS n FROM board_members WHERE board = ?1").bind(board).first<{ n: number }>();
    if (existing?.n && !force) continue;
    const members = content.board_members.filter((m) => m.board === board);
    await db.batch([
      db.prepare("DELETE FROM board_members WHERE board = ?1").bind(board),
      ...members.map((m, i) =>
        db.prepare("INSERT INTO board_members (board, role, name, sort_order) VALUES (?1, ?2, ?3, ?4)").bind(board, m.role, m.name, i),
      ),
    ]);
  }
  const about = content.pages.about;
  const contact = content.pages.contact;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  await db.batch(
    [
      [about.slug, about.title, about.heading ?? "", sanitizeArticleHtml(about.body_html ?? "")],
      [contact.slug, contact.title, "", `<p>${(contact.lines ?? []).map(esc).join("<br>")}</p>`],
    ].map((p) =>
      db
        .prepare(
          `INSERT INTO pages (slug, title, heading, body_html) VALUES (?1, ?2, ?3, ?4)
           ON CONFLICT(slug) ${force ? "DO UPDATE SET title = excluded.title, heading = excluded.heading, body_html = excluded.body_html" : onConflict}`,
        )
        .bind(...p),
    ),
  );

  // ------------------------------------------------------------ search index (derived; always rebuilt from DB)
  const docs = (
    await db
      .prepare(
        `SELECT a.id, a.title, a.body_html AS body, coalesce(group_concat(au.name, ' '), '') AS authors
         FROM articles a LEFT JOIN article_authors aa ON aa.article_id = a.id LEFT JOIN authors au ON au.id = aa.author_id
         GROUP BY a.id`,
      )
      .all<{ id: number; title: string; body: string; authors: string }>()
  ).results;
  const ftsStmts = [db.prepare("DELETE FROM articles_fts")];
  for (const d of docs) ftsStmts.push(...indexArticleStatements(db, { ...d, body: htmlToText(d.body) }).slice(1));
  for (let i = 0; i < ftsStmts.length; i += 50) await db.batch(ftsStmts.slice(i, i + 50));

  // ------------------------------------------------------------ migration issues (shown in admin)
  const issues = inventory
    .map((line) => line.split(","))
    .filter((cols) => cols[3] !== "extracted")
    .map(([legacyUrl, type, , status, ...note]) => ({ legacyUrl, type, status, note: note.join(",") }));
  await db.batch([
    db.prepare("DELETE FROM migration_issues"),
    ...[...issues, ...problems.map((p) => ({ legacyUrl: "-", type: "import", status: "failed", note: p }))].map((i) =>
      db.prepare("INSERT INTO migration_issues (legacy_url, type, status, note) VALUES (?1, ?2, ?3, ?4)").bind(i.legacyUrl, i.type, i.status, i.note),
    ),
  ]);

  // ------------------------------------------------------------ verification
  const one = async (sql: string) => (await db.prepare(sql).first<{ n: number }>())?.n ?? 0;
  const referenced = new Set<string>();
  for (const { body_html } of (await db.prepare("SELECT body_html FROM articles").all<{ body_html: string }>()).results) {
    for (const m of body_html.matchAll(/src="\/(uploads\/[^"]+)"/g)) referenced.add(m[1]);
  }
  const keys = new Set(mediaRows.map((r) => r.key));
  const missingInR2: string[] = [];
  for (const key of keys) if ((await store.sha256Of(key)) == null) missingInR2.push(key);
  report.verification = {
    source: {
      articles: content.articles.length,
      authors: content.authors.length,
      sections: content.sections.length,
      boardMembers: content.board_members.length,
      media: manifest.filter((m) => m.key.startsWith("uploads/")).length,
    },
    database: {
      articles: await one("SELECT count(*) AS n FROM articles"),
      publishedArticles: await one("SELECT count(*) AS n FROM articles WHERE status = 'published'"),
      authors: await one("SELECT count(*) AS n FROM authors"),
      sections: await one("SELECT count(*) AS n FROM sections"),
      boardMembers: await one("SELECT count(*) AS n FROM board_members"),
      media: await one("SELECT count(*) AS n FROM media"),
      articleAuthorLinks: await one("SELECT count(*) AS n FROM article_authors"),
      searchIndexRows: await one("SELECT count(*) AS n FROM articles_fts"),
    },
    articlesWithoutAuthor: (await db.prepare("SELECT id FROM articles WHERE id NOT IN (SELECT article_id FROM article_authors)").all<{ id: number }>()).results.map((r) => r.id),
    articlesWithoutSection: (await db.prepare("SELECT id FROM articles WHERE section_id IS NULL").all<{ id: number }>()).results.map((r) => r.id),
    emptyBodies: await one("SELECT count(*) AS n FROM articles WHERE length(trim(body_html)) = 0"),
    inlineImagesReferenced: referenced.size,
    inlineImagesWithoutMediaRow: [...referenced].filter((k) => !keys.has(k)),
    mediaRowsMissingInR2: missingInR2,
    replacementCharacters: await one("SELECT count(*) AS n FROM articles WHERE instr(body_html, char(65533)) > 0 OR instr(title, char(65533)) > 0"),
    problems,
  };
  report.finishedAt = new Date().toISOString();
  await writeFile(path.join(DATA, `import-report.${remote ? "remote" : "local"}.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.verification, null, 2));
  await proxy?.dispose();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
