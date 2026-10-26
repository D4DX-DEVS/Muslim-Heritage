"use server";

import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { adminAction } from "@/lib/admin/action";
import { getDb, schema } from "@/lib/db";
import { SITE } from "@/lib/site";
import { sectionSchema } from "@/lib/validation/admin";

export const saveSectionAction = adminAction(
  z.object({ id: z.number().int().positive().nullable(), data: sectionSchema }),
  async ({ id, data }, session) => {
    const db = getDb();
    const values = { ...data, title: data.title.normalize("NFC"), updatedAt: new Date().toISOString() };
    let sectionId = id;
    if (id == null) {
      const [row] = await db.insert(schema.sections).values({ ...values, conferenceId: SITE.conferenceId }).returning({ id: schema.sections.id });
      sectionId = row.id;
    } else {
      const res = await db.update(schema.sections).set(values).where(eq(schema.sections.id, id)).returning({ id: schema.sections.id });
      if (res.length === 0) return { ok: false, error: "Section not found." };
    }
    await logActivity(session.username, id == null ? "created" : "updated", "section", sectionId, data.title);
    return { ok: true, message: "Section saved." };
  },
);

export const deleteSectionAction = adminAction(z.object({ id: z.number().int().positive() }), async ({ id }, session) => {
  const db = getDb();
  const [{ n }] = await db.select({ n: count() }).from(schema.articles).where(eq(schema.articles.sectionId, id));
  if (n > 0) return { ok: false, error: `${n} article(s) are in this section. Move them to another section first.` };
  const res = await db.delete(schema.sections).where(eq(schema.sections.id, id)).returning({ title: schema.sections.title });
  if (res.length === 0) return { ok: false, error: "Section not found." };
  await logActivity(session.username, "deleted", "section", id, res[0].title);
  return { ok: true, message: "Section deleted." };
});
