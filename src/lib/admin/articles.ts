import "server-only";
import { sanitizeArticleHtml } from "@/lib/content/sanitize";
import { htmlToText, readingMinutes, summarize } from "@/lib/content/text";
import { getEnv } from "@/lib/env";
import { indexArticleStatements, removeFromIndexStatement } from "@/lib/search";
import type { ArticleInput } from "@/lib/validation/admin";

interface ArticleRow {
  id: number;
  title: string;
  summary: string;
  body_html: string;
  status: string;
  lead_image_id: number | null;
  thumbnail_id: number | null;
  published_at: string | null;
}

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ','now')";

function revisionStatement(db: D1Database, row: ArticleRow, actor: string): D1PreparedStatement {
  return db
    .prepare("INSERT INTO article_revisions (article_id, title, summary, body_html, status, created_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6)")
    .bind(row.id, row.title, row.summary, row.body_html, row.status, actor);
}

async function authorNames(db: D1Database, ids: number[]): Promise<string> {
  if (ids.length === 0) return "";
  const { results } = await db
    .prepare(`SELECT name FROM authors WHERE id IN (${ids.map((_, i) => `?${i + 1}`).join(",")})`)
    .bind(...ids)
    .all<{ name: string }>();
  return results.map((r) => r.name).join(" ");
}

/** Creates or updates an article atomically; returns its id. */
export async function saveArticle(id: number | null, input: ArticleInput, actor: string): Promise<number> {
  const db = getEnv().DB;
  const body = sanitizeArticleHtml(input.bodyHtml.normalize("NFC"));
  const text = htmlToText(body);
  const summary = input.summary || summarize(text);
  const title = input.title.normalize("NFC");
  const authorIds = [...new Set(input.authorIds)];

  let articleId = id;
  const stmts: D1PreparedStatement[] = [];

  if (articleId == null) {
    const created = await db
      .prepare(
        `INSERT INTO articles (title, summary, body_html, status, reading_minutes) VALUES (?1, ?2, ?3, 'draft', ?4) RETURNING id`,
      )
      .bind(title, summary, body, readingMinutes(text))
      .first<{ id: number }>();
    if (!created) throw new Error("insert failed");
    articleId = created.id;
  } else {
    const existing = await db.prepare("SELECT * FROM articles WHERE id = ?1").bind(articleId).first<ArticleRow>();
    if (!existing) throw new Error("article not found");
    stmts.push(revisionStatement(db, existing, actor));
  }

  stmts.push(
    db
      .prepare(
        `UPDATE articles SET title = ?2, summary = ?3, body_html = ?4, section_id = ?5, lead_image_id = ?6,
           thumbnail_id = coalesce(?6, thumbnail_id), featured_order = ?7, seo_title = ?8, seo_description = ?9,
           status = ?10, reading_minutes = ?11,
           published_at = CASE WHEN ?10 = 'published' THEN coalesce(published_at, ${NOW}) ELSE published_at END,
           updated_at = ${NOW}
         WHERE id = ?1`,
      )
      .bind(
        articleId,
        title,
        summary,
        body,
        input.sectionId,
        input.leadImageId,
        input.featuredOrder,
        input.seoTitle,
        input.seoDescription,
        input.status,
        readingMinutes(text),
      ),
    db.prepare("DELETE FROM article_authors WHERE article_id = ?1").bind(articleId),
    ...authorIds.map((authorId, position) =>
      db.prepare("INSERT INTO article_authors (article_id, author_id, position) VALUES (?1, ?2, ?3)").bind(articleId, authorId, position),
    ),
    ...indexArticleStatements(db, { id: articleId, title, authors: await authorNames(db, authorIds), body: text }),
  );
  await db.batch(stmts);
  return articleId;
}

export async function setArticleStatus(id: number, status: "draft" | "published", actor: string): Promise<boolean> {
  const db = getEnv().DB;
  const existing = await db.prepare("SELECT * FROM articles WHERE id = ?1").bind(id).first<ArticleRow>();
  if (!existing) return false;
  await db.batch([
    revisionStatement(db, existing, actor),
    db
      .prepare(
        `UPDATE articles SET status = ?2, updated_at = ${NOW},
           published_at = CASE WHEN ?2 = 'published' THEN coalesce(published_at, ${NOW}) ELSE published_at END
         WHERE id = ?1`,
      )
      .bind(id, status),
  ]);
  return true;
}

export async function restoreRevision(articleId: number, revisionId: number, actor: string): Promise<boolean> {
  const db = getEnv().DB;
  const [existing, rev] = await Promise.all([
    db.prepare("SELECT * FROM articles WHERE id = ?1").bind(articleId).first<ArticleRow>(),
    db.prepare("SELECT * FROM article_revisions WHERE id = ?1 AND article_id = ?2").bind(revisionId, articleId).first<ArticleRow & { article_id: number }>(),
  ]);
  if (!existing || !rev) return false;
  const text = htmlToText(rev.body_html);
  const { results } = await db
    .prepare("SELECT au.name FROM article_authors aa JOIN authors au ON au.id = aa.author_id WHERE aa.article_id = ?1")
    .bind(articleId)
    .all<{ name: string }>();
  await db.batch([
    revisionStatement(db, existing, actor),
    db
      .prepare(`UPDATE articles SET title = ?2, summary = ?3, body_html = ?4, reading_minutes = ?5, updated_at = ${NOW} WHERE id = ?1`)
      .bind(articleId, rev.title, rev.summary, rev.body_html, readingMinutes(text)),
    ...indexArticleStatements(db, { id: articleId, title: rev.title, authors: results.map((r) => r.name).join(" "), body: text }),
  ]);
  return true;
}

/** Rebuilds search rows for every article credited to an author (after a rename). */
export async function reindexAuthorArticles(authorId: number): Promise<void> {
  const db = getEnv().DB;
  const { results } = await db
    .prepare(
      `SELECT a.id, a.title, a.body_html,
         (SELECT group_concat(au.name, ' ') FROM article_authors x JOIN authors au ON au.id = x.author_id WHERE x.article_id = a.id) AS authors
       FROM articles a WHERE a.id IN (SELECT article_id FROM article_authors WHERE author_id = ?1)`,
    )
    .bind(authorId)
    .all<{ id: number; title: string; body_html: string; authors: string | null }>();
  if (results.length === 0) return;
  await db.batch(results.flatMap((r) => indexArticleStatements(db, { id: r.id, title: r.title, authors: r.authors ?? "", body: htmlToText(r.body_html) })));
}

export async function deleteArticle(id: number): Promise<boolean> {
  const db = getEnv().DB;
  const res = await db.batch([removeFromIndexStatement(db, id), db.prepare("DELETE FROM articles WHERE id = ?1").bind(id)]);
  return (res[1]?.meta.changes ?? 0) > 0;
}
