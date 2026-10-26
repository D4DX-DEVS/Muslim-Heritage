/**
 * Minimal D1Database stand-in over the Cloudflare REST API, for scripts that run
 * outside Workers. Covers what the importer uses: prepare/bind/first/all/run/batch.
 * Batches run sequentially (not one transaction); the importer is idempotent.
 */

interface QueryResult {
  results: Record<string, unknown>[];
  success: boolean;
  meta: { changes?: number };
}

class RestStatement {
  private readonly db: RestD1;
  readonly sql: string;
  readonly params: unknown[];

  constructor(db: RestD1, sql: string, params: unknown[] = []) {
    this.db = db;
    this.sql = sql;
    this.params = params;
  }

  bind(...params: unknown[]): RestStatement {
    return new RestStatement(this.db, this.sql, params);
  }

  async all<T>(): Promise<{ results: T[]; success: boolean; meta: QueryResult["meta"] }> {
    const r = await this.db.query(this.sql, this.params);
    return { results: r.results as T[], success: r.success, meta: r.meta };
  }

  async first<T>(): Promise<T | null> {
    const r = await this.db.query(this.sql, this.params);
    return (r.results[0] as T) ?? null;
  }

  async run(): Promise<QueryResult> {
    return this.db.query(this.sql, this.params);
  }
}

export class RestD1 {
  private readonly url: string;
  private readonly token: string;

  constructor(accountId: string, databaseId: string, token: string) {
    this.token = token;
    this.url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
  }

  prepare(sql: string): RestStatement {
    return new RestStatement(this, sql);
  }

  async batch(statements: RestStatement[]): Promise<QueryResult[]> {
    const out: QueryResult[] = [];
    for (const s of statements) out.push(await this.query(s.sql, s.params));
    return out;
  }

  async query(sql: string, params: unknown[]): Promise<QueryResult> {
    for (let attempt = 1; ; attempt++) {
      const res = await fetch(this.url, {
        method: "POST",
        headers: { authorization: `Bearer ${this.token}`, "content-type": "application/json" },
        body: JSON.stringify({ sql, params: params.map((p) => (p === undefined ? null : p)) }),
      });
      const body = (await res.json()) as { success: boolean; errors?: { message: string }[]; result?: QueryResult[] };
      if (res.ok && body.success && body.result?.[0]) return body.result[0];
      if (attempt < 4 && (res.status === 429 || res.status >= 500)) {
        await new Promise((r) => setTimeout(r, 500 * attempt));
        continue;
      }
      throw new Error(`D1 query failed (${res.status}): ${body.errors?.map((e) => e.message).join("; ")} — ${sql.slice(0, 120)}`);
    }
  }
}
