import "server-only";
import { getDb, schema } from "@/lib/db";

export async function logActivity(
  actor: string,
  action: string,
  entity: string,
  entityId: string | number | null,
  detail = "",
): Promise<void> {
  await getDb()
    .insert(schema.activityLogs)
    .values({ actor, action, entity, entityId: entityId == null ? null : String(entityId), detail: detail.slice(0, 500) });
}
