"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { adminAction } from "@/lib/admin/action";
import { getDb, schema } from "@/lib/db";

export const resolveIssueAction = adminAction(z.object({ id: z.number().int().positive() }), async ({ id }, session) => {
  const res = await getDb().update(schema.migrationIssues).set({ resolved: true }).where(eq(schema.migrationIssues.id, id)).returning({ id: schema.migrationIssues.id });
  if (res.length === 0) return { ok: false, error: "Issue not found." };
  await logActivity(session.username, "resolved", "migration_issue", id);
  return { ok: true, message: "Marked as resolved." };
});
