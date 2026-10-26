"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { adminAction } from "@/lib/admin/action";
import { deleteMediaObject } from "@/lib/admin/media";
import { getDb, schema } from "@/lib/db";
import { mediaUsage, type MediaUsage } from "@/lib/queries/admin";
import { mediaMetaSchema } from "@/lib/validation/admin";

const id = z.number().int().positive();

export const mediaUsageAction = adminAction<z.ZodObject<{ id: typeof id }>, MediaUsage[]>(z.object({ id }), async ({ id: mediaId }) => ({
  ok: true,
  data: await mediaUsage(mediaId),
}));

export const saveMediaMetaAction = adminAction(z.object({ id, data: mediaMetaSchema }), async ({ id: mediaId, data }, session) => {
  const res = await getDb()
    .update(schema.media)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(schema.media.id, mediaId))
    .returning({ id: schema.media.id });
  if (res.length === 0) return { ok: false, error: "File not found." };
  await logActivity(session.username, "updated", "media", mediaId);
  return { ok: true, message: "Details saved." };
});

export const deleteMediaAction = adminAction(z.object({ id }), async ({ id: mediaId }, session) => {
  // Re-check on the server: the UI warning is not a guarantee.
  const usage = await mediaUsage(mediaId);
  if (usage.length > 0) return { ok: false, error: `This file is still used in ${usage.length} place(s). Remove those references first.` };
  if (!(await deleteMediaObject(mediaId))) return { ok: false, error: "File not found." };
  await logActivity(session.username, "deleted", "media", mediaId);
  return { ok: true, message: "File deleted." };
});
