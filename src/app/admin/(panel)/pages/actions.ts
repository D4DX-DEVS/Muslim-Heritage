"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { adminAction } from "@/lib/admin/action";
import { sanitizeArticleHtml } from "@/lib/content/sanitize";
import { getDb, schema } from "@/lib/db";
import { pageSchema } from "@/lib/validation/admin";

export const savePageAction = adminAction(
  z.object({ slug: z.enum(["about", "contact"]), data: pageSchema }),
  async ({ slug, data }, session) => {
    const res = await getDb()
      .update(schema.pages)
      .set({ title: data.title, heading: data.heading, bodyHtml: sanitizeArticleHtml(data.bodyHtml.normalize("NFC")), updatedAt: new Date().toISOString() })
      .where(eq(schema.pages.slug, slug))
      .returning({ slug: schema.pages.slug });
    if (res.length === 0) return { ok: false, error: "Page not found." };
    await logActivity(session.username, "updated", "page", slug);
    return { ok: true, message: "Page saved." };
  },
);
