// FTS5 with the trigram tokenizer: every term needs >= 3 characters to use the
// index. Shorter queries fall back to LIKE over the same (small) FTS table.

const MAX_RESULTS = 500;

/** Escapes LIKE wildcards so user input matches literally (e.g. "amukham_1"). Use with ESCAPE '\'. */
export function likePattern(value: string): string {
  return `%${value.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

export function buildMatchExpression(query: string): string | null {
  const terms = query
    .normalize("NFC")
    .split(/\s+/)
    .map((t) => t.replace(/"/g, "").trim())
    .filter((t) => [...t].length >= 3);
  if (terms.length === 0) return null;
  return terms.map((t) => `"${t}"`).join(" AND ");
}

export async function searchArticleIds(query: string, db: D1Database): Promise<number[]> {
  const q = query.normalize("NFC").trim().slice(0, 200);
  if (!q) return [];
  const match = buildMatchExpression(q);
  const { results } = match
    ? await db
        .prepare(
          `SELECT rowid AS id FROM articles_fts WHERE articles_fts MATCH ?1
           ORDER BY bm25(articles_fts, 10.0, 5.0, 1.0) LIMIT ${MAX_RESULTS}`,
        )
        .bind(match)
        .all<{ id: number }>()
    : await db
        .prepare(
          `SELECT rowid AS id FROM articles_fts
           WHERE title LIKE ?1 ESCAPE '\\' OR authors LIKE ?1 ESCAPE '\\' OR body LIKE ?1 ESCAPE '\\' LIMIT ${MAX_RESULTS}`,
        )
        .bind(likePattern(q))
        .all<{ id: number }>();
  return results.map((r) => r.id);
}

export function indexArticleStatements(
  db: D1Database,
  doc: { id: number; title: string; authors: string; body: string },
): D1PreparedStatement[] {
  return [
    db.prepare("DELETE FROM articles_fts WHERE rowid = ?1").bind(doc.id),
    db
      .prepare("INSERT INTO articles_fts (rowid, title, authors, body) VALUES (?1, ?2, ?3, ?4)")
      .bind(doc.id, doc.title.normalize("NFC"), doc.authors.normalize("NFC"), doc.body.normalize("NFC")),
  ];
}

export function removeFromIndexStatement(db: D1Database, id: number): D1PreparedStatement {
  return db.prepare("DELETE FROM articles_fts WHERE rowid = ?1").bind(id);
}
