"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { adminAction } from "@/lib/admin/action";
import { getDb, schema } from "@/lib/db";
import { boardMemberSchema } from "@/lib/validation/admin";

export const saveBoardMemberAction = adminAction(
  z.object({ id: z.number().int().positive().nullable(), data: boardMemberSchema }),
  async ({ id, data }, session) => {
    const db = getDb();
    let memberId = id;
    if (id == null) {
      const [row] = await db.insert(schema.boardMembers).values(data).returning({ id: schema.boardMembers.id });
      memberId = row.id;
    } else {
      const res = await db
        .update(schema.boardMembers)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(schema.boardMembers.id, id))
        .returning({ id: schema.boardMembers.id });
      if (res.length === 0) return { ok: false, error: "Member not found." };
    }
    await logActivity(session.username, id == null ? "created" : "updated", "board_member", memberId, `${data.board}: ${data.name}`);
    return { ok: true, message: "Board member saved." };
  },
);

export const deleteBoardMemberAction = adminAction(z.object({ id: z.number().int().positive() }), async ({ id }, session) => {
  const res = await getDb().delete(schema.boardMembers).where(eq(schema.boardMembers.id, id)).returning({ name: schema.boardMembers.name });
  if (res.length === 0) return { ok: false, error: "Member not found." };
  await logActivity(session.username, "deleted", "board_member", id, res[0].name);
  return { ok: true, message: "Board member removed." };
});
