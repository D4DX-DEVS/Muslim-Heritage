import { z } from "zod";

// Shared by client forms (react-hook-form) and server actions.

const trimmed = (max: number) => z.string().trim().max(max, `Must be ${max} characters or fewer`);
const optionalId = z.preprocess(
  (v) => (v === "" || v === "none" || v == null ? null : Number(v)),
  z.number().int().positive().nullable(),
);

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Enter your username").max(100),
  password: z.string().min(1, "Enter your password").max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const articleSchema = z.object({
  title: trimmed(300).min(1, "Title is required"),
  summary: trimmed(600),
  bodyHtml: z.string().max(400_000, "Article body is too long"),
  sectionId: optionalId,
  authorIds: z.array(z.coerce.number().int().positive()).max(10),
  leadImageId: optionalId,
  featuredOrder: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(1).max(99).nullable()),
  seoTitle: trimmed(160),
  seoDescription: trimmed(300),
  status: z.enum(["draft", "published"]),
});
export type ArticleInput = z.infer<typeof articleSchema>;

export const authorSchema = z.object({
  name: trimmed(200).min(1, "Name is required"),
  designation: trimmed(300),
  bio: trimmed(5000),
  photoId: optionalId,
});
export type AuthorInput = z.infer<typeof authorSchema>;

export const sectionSchema = z.object({
  title: trimmed(200).min(1, "Title is required"),
  description: trimmed(2000),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  imageId: optionalId,
});
export type SectionInput = z.infer<typeof sectionSchema>;

export const boardMemberSchema = z.object({
  board: z.enum(["director", "advisory"]),
  role: trimmed(100).min(1, "Role is required"),
  name: trimmed(200).min(1, "Name is required"),
  sortOrder: z.coerce.number().int().min(0).max(9999),
});
export type BoardMemberInput = z.infer<typeof boardMemberSchema>;

export const pageSchema = z.object({
  title: trimmed(200).min(1, "Title is required"),
  heading: trimmed(300),
  bodyHtml: z.string().max(200_000),
});
export type PageInput = z.infer<typeof pageSchema>;

export const mediaMetaSchema = z.object({
  alt: trimmed(300),
  caption: trimmed(500),
  attribution: trimmed(300),
});
export type MediaMetaInput = z.infer<typeof mediaMetaSchema>;

export const UPLOAD_LIMIT_BYTES = 10 * 1024 * 1024;
export const UPLOAD_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
} as const;
