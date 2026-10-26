"use server";

import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { adminAction } from "@/lib/admin/action";
import { reindexAuthorArticles } from "@/lib/admin/articles";
import { getDb, schema } from "@/lib/db";
import { authorSchema } from "@/lib/validation/admin";

export const saveAuthorAction = adminAction(
  z.object({ id: z.number().int().positive().nullable(), data: authorSchema }),
  async ({ id, data }, session) => {
    const db = getDb();
    const values = { ...data, name: data.name.normalize("NFC"), designation: data.designation.normalize("NFC"), updatedAt: new Date().toISOString() };
    let authorId = id;
    if (id == null) {
      const [row] = await db.insert(schema.authors).values(values).returning({ id: schema.authors.id });
      authorId = row.id;
    } else {
      const res = await db.update(schema.authors).set(values).where(eq(schema.authors.id, id)).returning({ id: schema.authors.id });
      if (res.length === 0) return { ok: false, error: "Author not found." };
      await reindexAuthorArticles(id);
    }
    await logActivity(session.username, id == null ? "created" : "updated", "author", authorId, data.name);
    return { ok: true, data: { id: authorId! }, message: "Author saved." };
  },
);

export const deleteAuthorAction = adminAction(z.object({ id: z.number().int().positive() }), async ({ id }, session) => {
  const db = getDb();
  const [{ n }] = await db.select({ n: count() }).from(schema.articleAuthors).where(eq(schema.articleAuthors.authorId, id));
  if (n > 0) return { ok: false, error: `This author is credited on ${n} article(s). Remove them from those articles first.` };
  const res = await db.delete(schema.authors).where(eq(schema.authors.id, id)).returning({ name: schema.authors.name });
  if (res.length === 0) return { ok: false, error: "Author not found." };
  await logActivity(session.username, "deleted", "author", id, res[0].name);
  return { ok: true, message: "Author deleted." };
});
