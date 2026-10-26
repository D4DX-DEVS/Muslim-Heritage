import "server-only";
import { and, asc, count, desc, eq, inArray, like, or, sql, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { containsText } from "@/lib/db/like";

const { articles, articleAuthors, articleRevisions, authors, sections, media, activityLogs, migrationIssues, boardMembers, pages, conferenceMedia } = schema;

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

const meta = (page: number, pageSize: number, total: number): PageMeta => ({
  page,
  pageSize,
  total,
  pageCount: Math.max(1, Math.ceil(total / pageSize)),
});

export async function dashboardStats() {
  const db = getDb();
  const one = async (q: Promise<{ n: number }[]>) => (await q)[0]?.n ?? 0;
  const [total, published, drafts, authorCount, sectionCount, mediaCount, mediaBytes, openIssues, recent, activity] = await Promise.all([
    one(db.select({ n: count() }).from(articles)),
    one(db.select({ n: count() }).from(articles).where(eq(articles.status, "published"))),
    one(db.select({ n: count() }).from(articles).where(eq(articles.status, "draft"))),
    one(db.select({ n: count() }).from(authors)),
    one(db.select({ n: count() }).from(sections)),
    one(db.select({ n: count() }).from(media)),
    one(db.select({ n: sql<number>`coalesce(sum(${media.bytes}), 0)` }).from(media)),
    one(db.select({ n: count() }).from(migrationIssues).where(eq(migrationIssues.resolved, false))),
    db
      .select({ id: articles.id, title: articles.title, status: articles.status, updatedAt: articles.updatedAt })
      .from(articles)
      .orderBy(desc(articles.updatedAt), desc(articles.id))
      .limit(6),
    db.select().from(activityLogs).orderBy(desc(activityLogs.id)).limit(8),
  ]);
  return { total, published, drafts, authorCount, sectionCount, mediaCount, mediaBytes, openIssues, recent, activity };
}

// ------------------------------------------------------------------ articles

export interface AdminArticleQuery {
  q: string;
  status?: "draft" | "published";
  sectionId?: number;
  page: number;
  pageSize: number;
}

export async function listAdminArticles({ q, status, sectionId, page, pageSize }: AdminArticleQuery) {
  const db = getDb();
  const filters: SQL[] = [];
  if (status) filters.push(eq(articles.status, status));
  if (sectionId) filters.push(eq(articles.sectionId, sectionId));
  if (q) {
    const asId = /^\d+$/.test(q) ? Number(q) : null;
    filters.push(or(containsText(articles.title, q), asId ? eq(articles.id, asId) : undefined)!);
  }
  const where = filters.length ? and(...filters) : undefined;
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: articles.id,
        title: articles.title,
        status: articles.status,
        updatedAt: articles.updatedAt,
        section: sections.title,
      })
      .from(articles)
      .leftJoin(sections, eq(sections.id, articles.sectionId))
      .where(where)
      .orderBy(desc(articles.updatedAt), desc(articles.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(articles).where(where),
  ]);
  const ids = rows.map((r) => r.id);
  const authorRows = ids.length
    ? await db
        .select({ articleId: articleAuthors.articleId, name: authors.name })
        .from(articleAuthors)
        .innerJoin(authors, eq(authors.id, articleAuthors.authorId))
        .where(inArray(articleAuthors.articleId, ids))
    : [];
  return {
    rows: rows.map((r) => ({ ...r, authors: authorRows.filter((a) => a.articleId === r.id).map((a) => a.name) })),
    meta: meta(page, pageSize, total),
  };
}

export async function getArticleForEdit(id: number) {
  const db = getDb();
  const [article] = await db.select().from(articles).where(eq(articles.id, id));
  if (!article) return null;
  const [authorIds, revisions, lead] = await Promise.all([
    db.select({ id: articleAuthors.authorId }).from(articleAuthors).where(eq(articleAuthors.articleId, id)).orderBy(asc(articleAuthors.position)),
    db
      .select({ id: articleRevisions.id, title: articleRevisions.title, status: articleRevisions.status, createdBy: articleRevisions.createdBy, createdAt: articleRevisions.createdAt })
      .from(articleRevisions)
      .where(eq(articleRevisions.articleId, id))
      .orderBy(desc(articleRevisions.id))
      .limit(30),
    article.leadImageId ? db.select().from(media).where(eq(media.id, article.leadImageId)) : Promise.resolve([]),
  ]);
  return { article, authorIds: authorIds.map((a) => a.id), revisions, leadImage: lead[0] ?? null };
}

export async function pickerOptions() {
  const db = getDb();
  const [authorRows, sectionRows] = await Promise.all([
    db.select({ id: authors.id, name: authors.name }).from(authors).orderBy(asc(authors.name)),
    db.select({ id: sections.id, title: sections.title }).from(sections).orderBy(asc(sections.sortOrder), asc(sections.id)),
  ]);
  return { authors: authorRows, sections: sectionRows };
}

// ------------------------------------------------------------------ authors & sections

export async function listAdminAuthors({ q, page, pageSize }: { q: string; page: number; pageSize: number }) {
  const db = getDb();
  const where = q ? or(containsText(authors.name, q), containsText(authors.designation, q)) : undefined;
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({ id: authors.id, name: authors.name, designation: authors.designation, papers: count(articleAuthors.articleId), photoKey: media.key })
      .from(authors)
      .leftJoin(articleAuthors, eq(articleAuthors.authorId, authors.id))
      .leftJoin(media, eq(media.id, authors.photoId))
      .where(where)
      .groupBy(authors.id)
      .orderBy(asc(authors.name), asc(authors.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(authors).where(where),
  ]);
  return { rows, meta: meta(page, pageSize, total) };
}

export async function getAuthorForEdit(id: number) {
  const db = getDb();
  const [author] = await db.select().from(authors).where(eq(authors.id, id));
  if (!author) return null;
  const photo = author.photoId ? (await db.select().from(media).where(eq(media.id, author.photoId)))[0] ?? null : null;
  const [{ papers }] = await db.select({ papers: count() }).from(articleAuthors).where(eq(articleAuthors.authorId, id));
  return { author, photo, papers };
}

export async function listAdminSections() {
  return getDb()
    .select({ section: sections, articles: count(articles.id), imageKey: media.key })
    .from(sections)
    .leftJoin(articles, eq(articles.sectionId, sections.id))
    .leftJoin(media, eq(media.id, sections.imageId))
    .groupBy(sections.id)
    .orderBy(asc(sections.sortOrder), asc(sections.id));
}

export async function listBoardMembers() {
  return getDb().select().from(boardMembers).orderBy(asc(boardMembers.board), asc(boardMembers.sortOrder), asc(boardMembers.id));
}

export async function listPages() {
  return getDb().select().from(pages).orderBy(asc(pages.slug));
}

// ------------------------------------------------------------------ media

export async function listMedia({ q, type, page, pageSize }: { q: string; type?: "image" | "pdf"; page: number; pageSize: number }) {
  const db = getDb();
  const filters: SQL[] = [];
  if (q) filters.push(or(containsText(media.filename, q), containsText(media.alt, q), containsText(media.caption, q))!);
  if (type === "image") filters.push(like(media.mime, "image/%"));
  if (type === "pdf") filters.push(eq(media.mime, "application/pdf"));
  const where = filters.length ? and(...filters) : undefined;
  const [rows, [{ total }]] = await Promise.all([
    db.select().from(media).where(where).orderBy(desc(media.id)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ total: count() }).from(media).where(where),
  ]);
  return { rows, meta: meta(page, pageSize, total) };
}

export interface MediaUsage {
  label: string;
  href: string;
}

/** Every place a media item is referenced; deletion is refused while this is non-empty. */
export async function mediaUsage(id: number): Promise<MediaUsage[]> {
  const db = getDb();
  const [item] = await db.select().from(media).where(eq(media.id, id));
  if (!item) return [];
  const needle = `/${item.key}"`;
  const [arts, auths, secs, conf, pgs] = await Promise.all([
    db
      .select({ id: articles.id, title: articles.title })
      .from(articles)
      .where(or(eq(articles.leadImageId, id), eq(articles.thumbnailId, id), sql`instr(${articles.bodyHtml}, ${needle}) > 0`)),
    db.select({ id: authors.id, name: authors.name }).from(authors).where(eq(authors.photoId, id)),
    db.select({ id: sections.id, title: sections.title }).from(sections).where(eq(sections.imageId, id)),
    db.select({ id: conferenceMedia.conferenceId }).from(conferenceMedia).where(eq(conferenceMedia.mediaId, id)),
    db.select({ slug: pages.slug }).from(pages).where(or(eq(pages.imageId, id), sql`instr(${pages.bodyHtml}, ${needle}) > 0`)),
  ]);
  return [
    ...arts.map((a) => ({ label: `Article: ${a.title}`, href: `/admin/articles/${a.id}` })),
    ...auths.map((a) => ({ label: `Author photo: ${a.name}`, href: `/admin/authors/${a.id}` })),
    ...secs.map((s) => ({ label: `Section image: ${s.title}`, href: "/admin/sections" })),
    ...conf.map(() => ({ label: "Conference photographs", href: "/confindex/1" })),
    ...pgs.map((p) => ({ label: `Page: ${p.slug}`, href: "/admin/pages" })),
  ];
}

// ------------------------------------------------------------------ system

export async function listActivity({ page, pageSize }: { page: number; pageSize: number }) {
  const db = getDb();
  const [rows, [{ total }]] = await Promise.all([
    db.select().from(activityLogs).orderBy(desc(activityLogs.id)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ total: count() }).from(activityLogs),
  ]);
  return { rows, meta: meta(page, pageSize, total) };
}

export async function listMigrationIssues() {
  return getDb().select().from(migrationIssues).orderBy(asc(migrationIssues.resolved), asc(migrationIssues.id));
}
