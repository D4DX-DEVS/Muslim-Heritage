import { count, isNotNull } from "drizzle-orm";
import { AdminPageHeader } from "@/components/admin/page-header";
import { getDb, schema } from "@/lib/db";
import { listMigrationIssues } from "@/lib/queries/admin";
import { IssueResolveButton } from "./resolve-button";

export const metadata = { title: "Migration report" };

export default async function MigrationPage() {
  const db = getDb();
  const [issues, [articles], [authors], [sections], [media], [board]] = await Promise.all([
    listMigrationIssues(),
    db.select({ n: count() }).from(schema.articles),
    db.select({ n: count() }).from(schema.authors),
    db.select({ n: count() }).from(schema.sections),
    db.select({ n: count() }).from(schema.media).where(isNotNull(schema.media.legacyUrl)),
    db.select({ n: count() }).from(schema.boardMembers),
  ]);
  const open = issues.filter((i) => !i.resolved);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Migration report"
        description="Content imported from the legacy muslimheritage.in site. Full report: docs/MIGRATION_REPORT.md."
        crumbs={[{ label: "Migration report" }]}
      />
      <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {[
          ["Articles", articles.n],
          ["Authors", authors.n],
          ["Sections", sections.n],
          ["Migrated media", media.n],
          ["Board members", board.n],
        ].map(([label, n]) => (
          <div key={label} className="rounded-lg border border-border bg-card p-4">
            <dt className="truncate text-xs text-muted-foreground sm:text-sm">{label}</dt>
            <dd className="font-heading text-lg font-bold text-heritage-900 sm:text-2xl">{n}</dd>
          </div>
        ))}
      </dl>
      <section className="rounded-lg border border-border bg-card" aria-labelledby="issues-heading">
        <h2 id="issues-heading" className="border-b border-border px-4 py-3 font-heading font-semibold text-heritage-900">
          Issues needing review <span className="text-sm font-normal text-muted-foreground">({open.length} open)</span>
        </h2>
        {issues.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No issues were recorded.</p>
        ) : (
          <ul className="divide-y divide-border">
            {issues.map((i) => (
              <li key={i.id} className={`flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between ${i.resolved ? "opacity-60" : ""}`}>
                <div className="min-w-0">
                  <p className="font-medium">
                    <span className="font-mono">{i.legacyUrl}</span> <span className="text-muted-foreground">· {i.type}</span>{" "}
                    <span className={i.status === "failed" ? "text-destructive" : "text-gold-700"}>{i.status}</span>
                    {i.resolved && <span className="ml-2 text-heritage-700">(resolved)</span>}
                  </p>
                  <p className="text-muted-foreground">{i.note}</p>
                </div>
                {!i.resolved && <IssueResolveButton id={i.id} />}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
