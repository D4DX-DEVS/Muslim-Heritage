import "server-only";
import { getEnv } from "@/lib/env";
import { searchArticleIds as search } from "@/lib/search-core";

export { indexArticleStatements, removeFromIndexStatement } from "@/lib/search-core";

export function searchArticleIds(query: string): Promise<number[]> {
  return search(query, getEnv().DB);
}
