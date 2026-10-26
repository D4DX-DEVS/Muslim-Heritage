import { sql, type AnyColumn, type SQL } from "drizzle-orm";
import { likePattern } from "@/lib/search-core";

/** Case-insensitive (ASCII) substring match with escaped wildcards. */
export function containsText(column: AnyColumn, value: string): SQL {
  return sql`${column} LIKE ${likePattern(value)} ESCAPE '\\'`;
}
