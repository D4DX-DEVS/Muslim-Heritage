"use server";

import { z } from "zod";
import { adminAction } from "@/lib/admin/action";
import { deleteArticle, restoreRevision, saveArticle, setArticleStatus } from "@/lib/admin/articles";
import { logActivity } from "@/lib/activity";
import { articleSchema } from "@/lib/validation/admin";

const id = z.number().int().positive();

export const saveArticleAction = adminAction(
  z.object({ id: id.nullable(), data: articleSchema }),
  async ({ id: articleId, data }, session) => {
    const savedId = await saveArticle(articleId, data, session.username);
    await logActivity(session.username, articleId == null ? "created" : "updated", "article", savedId, data.title);
    return { ok: true, data: { id: savedId }, message: data.status === "published" ? "Article saved and published." : "Draft saved." };
  },
);

export const setStatusAction = adminAction(
  z.object({ id, status: z.enum(["draft", "published"]) }),
  async ({ id: articleId, status }, session) => {
    if (!(await setArticleStatus(articleId, status, session.username))) return { ok: false, error: "Article not found." };
    await logActivity(session.username, status === "published" ? "published" : "unpublished", "article", articleId);
    return { ok: true, message: status === "published" ? "Article published." : "Article moved to drafts." };
  },
);

export const restoreRevisionAction = adminAction(z.object({ id, revisionId: id }), async ({ id: articleId, revisionId }, session) => {
  if (!(await restoreRevision(articleId, revisionId, session.username))) return { ok: false, error: "Revision not found." };
  await logActivity(session.username, "restored_revision", "article", articleId, `revision ${revisionId}`);
  return { ok: true, message: "Revision restored. The previous version was saved to history." };
});

export const deleteArticleAction = adminAction(z.object({ id }), async ({ id: articleId }, session) => {
  if (!(await deleteArticle(articleId))) return { ok: false, error: "Article not found." };
  await logActivity(session.username, "deleted", "article", articleId);
  return { ok: true, message: "Article deleted." };
});
