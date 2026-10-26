import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// Row ids for migrated content equal the legacy Laravel ids, so the legacy
// URLs (/innermore/:id, /author/:id, /innerindex/:id, /confindex/:id) stay valid.

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
};

export const media = sqliteTable(
  "media",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    key: text("key").notNull(),
    legacyUrl: text("legacy_url"),
    filename: text("filename").notNull(),
    mime: text("mime").notNull(),
    bytes: integer("bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    sha256: text("sha256"),
    alt: text("alt").notNull().default(""),
    caption: text("caption").notNull().default(""),
    attribution: text("attribution").notNull().default(""),
    ...timestamps,
  },
  (t) => [uniqueIndex("media_key_uq").on(t.key), index("media_created_idx").on(t.createdAt)],
);

export const conferences = sqliteTable("conferences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  description: text("description").notNull().default(""),
  ...timestamps,
});

export const conferenceMedia = sqliteTable(
  "conference_media",
  {
    conferenceId: integer("conference_id")
      .notNull()
      .references(() => conferences.id, { onDelete: "cascade" }),
    mediaId: integer("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "restrict" }),
    kind: text("kind", { enum: ["slide", "gallery"] }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.conferenceId, t.mediaId, t.kind] })],
);

export const sections = sqliteTable(
  "sections",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    conferenceId: integer("conference_id").references(() => conferences.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    imageId: integer("image_id").references(() => media.id, { onDelete: "set null" }),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("sections_order_idx").on(t.sortOrder, t.id)],
);

export const authors = sqliteTable(
  "authors",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    designation: text("designation").notNull().default(""),
    bio: text("bio").notNull().default(""),
    photoId: integer("photo_id").references(() => media.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("authors_name_idx").on(t.name)],
);

export const articles = sqliteTable(
  "articles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    bodyHtml: text("body_html").notNull().default(""),
    sectionId: integer("section_id").references(() => sections.id, { onDelete: "set null" }),
    conferenceId: integer("conference_id").references(() => conferences.id, { onDelete: "set null" }),
    leadImageId: integer("lead_image_id").references(() => media.id, { onDelete: "set null" }),
    thumbnailId: integer("thumbnail_id").references(() => media.id, { onDelete: "set null" }),
    status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
    publishedAt: text("published_at"),
    featuredOrder: integer("featured_order"),
    sortOrder: integer("sort_order").notNull().default(0),
    readingMinutes: integer("reading_minutes").notNull().default(1),
    seoTitle: text("seo_title").notNull().default(""),
    seoDescription: text("seo_description").notNull().default(""),
    ...timestamps,
  },
  (t) => [
    index("articles_status_published_idx").on(t.status, t.publishedAt, t.id),
    index("articles_section_idx").on(t.sectionId, t.status, t.sortOrder, t.id),
    index("articles_featured_idx").on(t.featuredOrder),
    index("articles_updated_idx").on(t.updatedAt),
  ],
);

export const articleAuthors = sqliteTable(
  "article_authors",
  {
    articleId: integer("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    authorId: integer("author_id")
      .notNull()
      .references(() => authors.id, { onDelete: "restrict" }),
    position: integer("position").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.articleId, t.authorId] }), index("article_authors_author_idx").on(t.authorId)],
);

export const articleRevisions = sqliteTable(
  "article_revisions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    articleId: integer("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    bodyHtml: text("body_html").notNull(),
    status: text("status").notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("article_revisions_article_idx").on(t.articleId, t.id)],
);

export const boardMembers = sqliteTable(
  "board_members",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    board: text("board", { enum: ["director", "advisory"] }).notNull(),
    role: text("role").notNull().default("Member"),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("board_members_board_idx").on(t.board, t.sortOrder, t.id)],
);

export const pages = sqliteTable("pages", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  heading: text("heading").notNull().default(""),
  bodyHtml: text("body_html").notNull().default(""),
  imageId: integer("image_id").references(() => media.id, { onDelete: "set null" }),
  ...timestamps,
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(), // HMAC of the cookie token, never the token itself
    username: text("username").notNull(),
    expiresAt: integer("expires_at").notNull(),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("sessions_expires_idx").on(t.expiresAt)],
);

export const loginAttempts = sqliteTable("login_attempts", {
  key: text("key").primaryKey(),
  failures: integer("failures").notNull().default(0),
  windowStart: integer("window_start").notNull(),
  lockedUntil: integer("locked_until"),
});

export const activityLogs = sqliteTable(
  "activity_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    actor: text("actor").notNull(),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    detail: text("detail").notNull().default(""),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("activity_logs_created_idx").on(t.createdAt)],
);

export const migrationIssues = sqliteTable("migration_issues", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  legacyUrl: text("legacy_url").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull(),
  note: text("note").notNull().default(""),
  resolved: integer("resolved", { mode: "boolean" }).notNull().default(false),
});

export type Article = typeof articles.$inferSelect;
export type Author = typeof authors.$inferSelect;
export type Section = typeof sections.$inferSelect;
export type Media = typeof media.$inferSelect;
export type BoardMember = typeof boardMembers.$inferSelect;
