import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

const WINDOW_SECONDS = 15 * 60;
const MAX_FAILURES = 5;
const LOCK_SECONDS = 15 * 60;

const now = () => Math.floor(Date.now() / 1000);

/** Seconds until the key may try again, or 0 when allowed. */
export async function lockedFor(key: string): Promise<number> {
  const [row] = await getDb().select().from(schema.loginAttempts).where(eq(schema.loginAttempts.key, key));
  if (!row?.lockedUntil) return 0;
  return Math.max(0, row.lockedUntil - now());
}

export async function recordFailure(key: string): Promise<void> {
  const db = getDb();
  const t = now();
  const [row] = await db.select().from(schema.loginAttempts).where(eq(schema.loginAttempts.key, key));
  const fresh = !row || t - row.windowStart > WINDOW_SECONDS;
  const failures = fresh ? 1 : row.failures + 1;
  const values = {
    key,
    failures,
    windowStart: fresh ? t : row.windowStart,
    lockedUntil: failures >= MAX_FAILURES ? t + LOCK_SECONDS : null,
  };
  await db.insert(schema.loginAttempts).values(values).onConflictDoUpdate({ target: schema.loginAttempts.key, set: values });
}

export async function clearFailures(key: string): Promise<void> {
  await getDb().delete(schema.loginAttempts).where(eq(schema.loginAttempts.key, key));
}
