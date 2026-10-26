import "server-only";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import { getEnv } from "@/lib/env";
import * as schema from "./schema";

export type Db = DrizzleD1Database<typeof schema>;

export function getDb(): Db {
  return drizzle(getEnv().DB, { schema });
}

export { schema };
