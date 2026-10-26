import Link from "next/link";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { Container, PageHeader } from "@/components/site/page-header";
import { EmptyState } from "@/components/shared/states";
import { siteUrl } from "@/lib/env";
import { getBoard } from "@/lib/queries/public";

const TITLES = { director: "Director Board", advisory: "Advisory Board" } as const;

export async function BoardPage({ board }: { board: "director" | "advisory" }) {
  const members = await getBoard(board);
  const officers = members.filter((m) => m.role !== "Member");
  const rest = members.filter((m) => m.role === "Member");
  const other = board === "director" ? "advisory" : "director";

  return (
    <>
      <PageHeader eyebrow="Kerala Muslim Heritage Foundation" title={TITLES[board]}>
        <Breadcrumbs siteUrl={siteUrl()} items={[{ label: "About", href: "/about" }, { label: TITLES[board] }]} />
      </PageHeader>
      <Container className="space-y-10 py-8 lg:py-12">
        {members.length === 0 && <EmptyState title="No members listed" />}
        {officers.length > 0 && (
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {officers.map((m) => (
              <div key={m.id} className="rounded-lg border border-border bg-card p-4 sm:p-5">
                <dt className="text-xs font-semibold uppercase tracking-wider text-gold-700">{m.role}</dt>
                <dd className="mt-1 font-heading text-lg font-semibold text-heritage-900">{m.name}</dd>
              </div>
            ))}
          </dl>
        )}
        {rest.length > 0 && (
          <section aria-labelledby="members-heading">
            <h2 id="members-heading" className="mb-4 font-heading text-xl font-bold text-heritage-900">
              Members <span className="text-sm font-normal text-muted-foreground">({rest.length})</span>
            </h2>
            <ul className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((m) => (
                <li key={m.id} className="border-b border-border py-2.5">
                  {m.name}
                </li>
              ))}
            </ul>
          </section>
        )}
        <Link href={`/${other}`} className="inline-flex min-h-11 items-center font-semibold text-heritage-700 hover:text-gold-700">
          View the {TITLES[other]} →
        </Link>
      </Container>
    </>
  );
}
