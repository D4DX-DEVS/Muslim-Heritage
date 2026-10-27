import "server-only";
import { and, asc, count, desc, eq, inArray, isNotNull, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { containsText } from "@/lib/db/like";
import { mediaUrl } from "@/lib/media-url";
import { searchArticleIds } from "@/lib/search";

const { articles, articleAuthors, authors, sections, media, conferences, conferenceMedia, boardMembers, pages } = schema;

export interface MediaRef {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  caption: string;
  attribution: string;
}

export interface AuthorRef {
  id: number;
  name: string;
  designation: string;
  photo: MediaRef | null;
}

export interface ArticleCard {
  id: number;
  title: string;
  summary: string;
  readingMinutes: number;
  publishedAt: string | null;
  section: { id: number; title: string } | null;
  image: MediaRef | null;
  authors: AuthorRef[];
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

function toMediaRef(m: typeof media.$inferSelect | null | undefined, fallbackAlt = ""): MediaRef | null {
  if (!m) return null;
  return {
    url: mediaUrl(m.key),
    alt: m.alt || fallbackAlt,
    width: m.width,
    height: m.height,
    caption: m.caption,
    attribution: m.attribution,
  };
}

// D1 allows at most 100 bound parameters per query, so long id lists are queried in batches.
const BATCH = 90;

async function inBatches<T>(ids: number[], query: (batch: number[]) => Promise<T[]>): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += BATCH) out.push(...(await query(ids.slice(i, i + BATCH))));
  return out;
}

async function mediaMap(ids: (number | null)[]): Promise<Map<number, typeof media.$inferSelect>> {
  const unique = [...new Set(ids.filter((x): x is number => x != null))];
  if (unique.length === 0) return new Map();
  const rows = await inBatches(unique, (batch) => getDb().select().from(media).where(inArray(media.id, batch)));
  return new Map(rows.map((r) => [r.id, r]));
}

async function authorsFor(articleIds: number[]): Promise<Map<number, AuthorRef[]>> {
  const result = new Map<number, AuthorRef[]>();
  if (articleIds.length === 0) return result;
  const rows = await inBatches(articleIds, (batch) =>
    getDb()
      .select({ articleId: articleAuthors.articleId, author: authors })
      .from(articleAuthors)
      .innerJoin(authors, eq(authors.id, articleAuthors.authorId))
      .where(inArray(articleAuthors.articleId, batch))
      .orderBy(asc(articleAuthors.position)),
  );
  const photos = await mediaMap(rows.map((r) => r.author.photoId));
  for (const { articleId, author } of rows) {
    const list = result.get(articleId) ?? [];
    list.push({
      id: author.id,
      name: author.name,
      designation: author.designation,
      photo: toMediaRef(photos.get(author.photoId ?? -1), author.name),
    });
    result.set(articleId, list);
  }
  return result;
}

async function toCards(rows: (typeof articles.$inferSelect)[]): Promise<ArticleCard[]> {
  const ids = rows.map((r) => r.id);
  const [authorMap, images, sectionRows] = await Promise.all([
    authorsFor(ids),
    mediaMap(rows.map((r) => r.thumbnailId ?? r.leadImageId)),
    rows.some((r) => r.sectionId != null)
      ? getDb()
          .select({ id: sections.id, title: sections.title })
          .from(sections)
          .where(inArray(sections.id, [...new Set(rows.map((r) => r.sectionId).filter((x): x is number => x != null))]))
      : Promise.resolve([]),
  ]);
  const sectionById = new Map(sectionRows.map((s) => [s.id, s]));
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    summary: r.summary,
    readingMinutes: r.readingMinutes,
    publishedAt: r.publishedAt,
    section: r.sectionId != null ? sectionById.get(r.sectionId) ?? null : null,
    image: toMediaRef(images.get(r.thumbnailId ?? r.leadImageId ?? -1), r.title),
    authors: authorMap.get(r.id) ?? [],
  }));
}

function paged<T>(items: T[], total: number, page: number, pageSize: number): Paged<T> {
  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

const published = eq(articles.status, "published");

// ------------------------------------------------------------------ articles

export type ArticleSort = "default" | "title" | "recent";

export interface ArticleQuery {
  q?: string;
  sectionId?: number;
  sort?: ArticleSort;
  page: number;
  pageSize: number;
}

export async function listArticles({ q, sectionId, sort = "default", page, pageSize }: ArticleQuery): Promise<Paged<ArticleCard>> {
  const db = getDb();
  const filters = [published];
  if (sectionId) filters.push(eq(articles.sectionId, sectionId));

  if (q && q.trim()) {
    // Ranked ids come from FTS; filtering and paging happen on that id list.
    const ids = await searchArticleIds(q);
    if (ids.length === 0) return paged([], 0, page, pageSize);
    const rows = await db.select().from(articles).where(and(...filters, inArray(articles.id, ids)));
    const order = new Map(ids.map((id, i) => [id, i]));
    const sorted = rows.sort((a, b) =>
      sort === "title" ? a.title.localeCompare(b.title, "ml") || a.id - b.id : (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
    );
    return paged(await toCards(sorted.slice((page - 1) * pageSize, page * pageSize)), sorted.length, page, pageSize);
  }

  const orderBy =
    sort === "title"
      ? [asc(articles.title), asc(articles.id)]
      : sort === "recent"
        ? [desc(articles.updatedAt), desc(articles.id)]
        : [asc(sql`coalesce(${articles.sectionId}, 0)`), asc(articles.sortOrder), asc(articles.id)];
  const [rows, [{ total }]] = await Promise.all([
    db.select().from(articles).where(and(...filters)).orderBy(...orderBy).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ total: count() }).from(articles).where(and(...filters)),
  ]);
  return paged(await toCards(rows), total, page, pageSize);
}

export async function featuredArticles(): Promise<ArticleCard[]> {
  const rows = await getDb()
    .select()
    .from(articles)
    .where(and(published, isNotNull(articles.featuredOrder)))
    .orderBy(asc(articles.featuredOrder), asc(articles.id));
  return toCards(rows);
}

export async function articlesByIds(ids: number[]): Promise<ArticleCard[]> {
  if (ids.length === 0) return [];
  const rows = await getDb().select().from(articles).where(and(published, inArray(articles.id, ids)));
  const order = new Map(ids.map((id, i) => [id, i]));
  return toCards(rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)));
}

export interface ArticleDetail {
  article: typeof articles.$inferSelect;
  authors: AuthorRef[];
  section: { id: number; title: string } | null;
  leadImage: MediaRef | null;
  prev: { id: number; title: string } | null;
  next: { id: number; title: string } | null;
  related: ArticleCard[];
}

export async function getArticle(id: number, { includeDrafts = false } = {}): Promise<ArticleDetail | null> {
  const db = getDb();
  const [article] = await db
    .select()
    .from(articles)
    .where(includeDrafts ? eq(articles.id, id) : and(eq(articles.id, id), published));
  if (!article) return null;

  const [authorMap, images, sectionRow] = await Promise.all([
    authorsFor([id]),
    mediaMap([article.leadImageId]),
    article.sectionId != null
      ? db.select({ id: sections.id, title: sections.title }).from(sections).where(eq(sections.id, article.sectionId))
      : Promise.resolve([]),
  ]);

  // Previous/next follow reading order within the section (or the featured run).
  const scope = article.sectionId != null ? eq(articles.sectionId, article.sectionId) : isNotNull(articles.featuredOrder);
  const siblings = await db
    .select({ id: articles.id, title: articles.title })
    .from(articles)
    .where(and(published, scope))
    .orderBy(asc(articles.featuredOrder), asc(articles.sortOrder), asc(articles.id));
  const pos = siblings.findIndex((s) => s.id === id);
  const related = await toCards(
    (
      await db
        .select()
        .from(articles)
        .where(and(published, scope, sql`${articles.id} <> ${id}`))
        .orderBy(asc(articles.sortOrder), asc(articles.id))
        .limit(4)
    ),
  );

  return {
    article,
    authors: authorMap.get(id) ?? [],
    section: sectionRow[0] ?? null,
    leadImage: toMediaRef(images.get(article.leadImageId ?? -1), article.title),
    prev: pos > 0 ? siblings[pos - 1] : null,
    next: pos >= 0 && pos < siblings.length - 1 ? siblings[pos + 1] : null,
    related,
  };
}

// ------------------------------------------------------------------ sections

export interface SectionSummary {
  id: number;
  title: string;
  description: string;
  articleCount: number;
  image: MediaRef | null;
}

export async function listSections(): Promise<SectionSummary[]> {
  const db = getDb();
  const rows = await db
    .select({ section: sections, articleCount: count(articles.id) })
    .from(sections)
    .leftJoin(articles, and(eq(articles.sectionId, sections.id), published))
    .groupBy(sections.id)
    .orderBy(asc(sections.sortOrder), asc(sections.id));
  const images = await mediaMap(rows.map((r) => r.section.imageId));
  return rows.map(({ section, articleCount }) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    articleCount,
    image: toMediaRef(images.get(section.imageId ?? -1), section.title),
  }));
}

export interface ContentsSection {
  id: number;
  title: string;
  articles: { id: number; title: string; authors: string }[];
}

/** The proceedings' table of contents: every section with its published papers, in volume order. */
export async function contentsBySection(): Promise<ContentsSection[]> {
  const db = getDb();
  const [sectionRows, articleRows] = await Promise.all([
    db.select({ id: sections.id, title: sections.title }).from(sections).orderBy(asc(sections.sortOrder), asc(sections.id)),
    db
      .select({ id: articles.id, title: articles.title, sectionId: articles.sectionId })
      .from(articles)
      .where(and(published, isNotNull(articles.sectionId)))
      .orderBy(asc(articles.sortOrder), asc(articles.id)),
  ]);
  const authorMap = await authorsFor(articleRows.map((a) => a.id));
  return sectionRows
    .map((s) => ({
      ...s,
      articles: articleRows
        .filter((a) => a.sectionId === s.id)
        .map((a) => ({ id: a.id, title: a.title, authors: (authorMap.get(a.id) ?? []).map((x) => x.name).join(", ") })),
    }))
    .filter((s) => s.articles.length > 0);
}

export async function getSection(id: number): Promise<SectionSummary | null> {
  return (await listSections()).find((s) => s.id === id) ?? null;
}

// ------------------------------------------------------------------ authors

export interface AuthorSummary extends AuthorRef {
  bio: string;
  articleCount: number;
}

export async function listAuthors({ q, page, pageSize }: { q?: string; page: number; pageSize: number }): Promise<Paged<AuthorSummary>> {
  const db = getDb();
  const term = q?.trim();
  const where = term ? or(containsText(authors.name, term), containsText(authors.designation, term)) : undefined;
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({ author: authors, articleCount: count(articles.id) })
      .from(authors)
      .leftJoin(articleAuthors, eq(articleAuthors.authorId, authors.id))
      .leftJoin(articles, and(eq(articles.id, articleAuthors.articleId), published))
      .where(where)
      .groupBy(authors.id)
      .orderBy(asc(authors.name), asc(authors.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(authors).where(where),
  ]);
  const photos = await mediaMap(rows.map((r) => r.author.photoId));
  return paged(
    rows.map(({ author, articleCount }) => ({
      id: author.id,
      name: author.name,
      designation: author.designation,
      bio: author.bio,
      articleCount,
      photo: toMediaRef(photos.get(author.photoId ?? -1), author.name),
    })),
    total,
    page,
    pageSize,
  );
}

export async function getAuthor(id: number): Promise<{ author: AuthorSummary; articles: ArticleCard[] } | null> {
  const db = getDb();
  const [author] = await db.select().from(authors).where(eq(authors.id, id));
  if (!author) return null;
  const rows = await db
    .select({ article: articles })
    .from(articleAuthors)
    .innerJoin(articles, eq(articles.id, articleAuthors.articleId))
    .where(and(eq(articleAuthors.authorId, id), published))
    .orderBy(asc(articles.id));
  const photos = await mediaMap([author.photoId]);
  return {
    author: {
      id: author.id,
      name: author.name,
      designation: author.designation,
      bio: author.bio,
      articleCount: rows.length,
      photo: toMediaRef(photos.get(author.photoId ?? -1), author.name),
    },
    articles: await toCards(rows.map((r) => r.article)),
  };
}

/** Authors with the most published papers, for the homepage. */
export interface ShelfAuthor {
  id: number;
  name: string;
  section: { id: number; title: string };
}

/** Authors with the section of their first published paper, most prolific first. */
export async function shelfAuthors(limit: number): Promise<ShelfAuthor[]> {
  const rows = await getDb()
    .select({
      id: authors.id,
      name: authors.name,
      sectionId: sql<number>`min(${sections.id})`,
      sectionTitle: sql<string>`min(${sections.title})`,
      papers: count(articles.id),
    })
    .from(authors)
    .innerJoin(articleAuthors, eq(articleAuthors.authorId, authors.id))
    .innerJoin(articles, and(eq(articles.id, articleAuthors.articleId), published))
    .innerJoin(sections, eq(sections.id, articles.sectionId))
    .groupBy(authors.id)
    .orderBy(desc(count(articles.id)), asc(authors.id))
    .limit(limit);
  return rows.map((r) => ({ id: r.id, name: r.name, section: { id: r.sectionId, title: r.sectionTitle } }));
}

// ------------------------------------------------------------------ conference, boards, pages

export interface ConferenceDetail {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  slides: MediaRef[];
  gallery: MediaRef[];
}

export async function getConference(id: number): Promise<ConferenceDetail | null> {
  const db = getDb();
  const [conf] = await db.select().from(conferences).where(eq(conferences.id, id));
  if (!conf) return null;
  const rows = await db
    .select({ kind: conferenceMedia.kind, media })
    .from(conferenceMedia)
    .innerJoin(media, eq(media.id, conferenceMedia.mediaId))
    .where(eq(conferenceMedia.conferenceId, id))
    .orderBy(asc(conferenceMedia.sortOrder));
  const alt = conf.title;
  return {
    id: conf.id,
    title: conf.title,
    subtitle: conf.subtitle,
    description: conf.description,
    slides: rows.filter((r) => r.kind === "slide").map((r) => toMediaRef(r.media, alt)!),
    gallery: rows.filter((r) => r.kind === "gallery").map((r) => toMediaRef(r.media, alt)!),
  };
}

export async function getBoard(board: "director" | "advisory") {
  return getDb()
    .select()
    .from(boardMembers)
    .where(eq(boardMembers.board, board))
    .orderBy(asc(boardMembers.sortOrder), asc(boardMembers.id));
}

export async function getPage(slug: string) {
  const [page] = await getDb().select().from(pages).where(eq(pages.slug, slug));
  return page ?? null;
}

export async function archiveStats(): Promise<{ articles: number; authors: number; sections: number }> {
  const db = getDb();
  const [[a], [au], [s]] = await Promise.all([
    db.select({ n: count() }).from(articles).where(published),
    db.select({ n: count() }).from(authors),
    db.select({ n: count() }).from(sections),
  ]);
  return { articles: a.n, authors: au.n, sections: s.n };
}

export async function sitemapEntries() {
  const db = getDb();
  const [a, au, s] = await Promise.all([
    db.select({ id: articles.id, updatedAt: articles.updatedAt }).from(articles).where(published),
    db.select({ id: authors.id, updatedAt: authors.updatedAt }).from(authors),
    db.select({ id: sections.id, updatedAt: sections.updatedAt }).from(sections),
  ]);
  return { articles: a, authors: au, sections: s };
}
