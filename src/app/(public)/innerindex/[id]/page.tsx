import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/site/article-card";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { Container, PageHeader } from "@/components/site/page-header";
import { DataPagination } from "@/components/shared/data-pagination";
import { EmptyState } from "@/components/shared/states";
import { siteUrl } from "@/lib/env";
import { listingHref, parseId, parseListing } from "@/lib/params";
import { getSection, listArticles, listSections } from "@/lib/queries/public";

const PAGE_SIZE = 10;

export async function generateMetadata({ params, searchParams }: PageProps<"/innerindex/[id]">): Promise<Metadata> {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const sectionId = parseId(id);
  const section = sectionId ? await getSection(sectionId) : null;
  if (!section) return { title: "Section not found" };
  const { page } = parseListing(sp);
  return {
    title: page > 1 ? `${section.title} — page ${page}` : section.title,
    description: `${section.articleCount} papers in “${section.title}” — Kerala Muslim History Conference proceedings.`,
    alternates: { canonical: listingHref(`/innerindex/${section.id}`, { page }) },
  };
}

export default async function SectionPage({ params, searchParams }: PageProps<"/innerindex/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const sectionId = parseId(id);
  if (!sectionId) notFound();
  const { page } = parseListing(sp);
  const [section, sections, result] = await Promise.all([
    getSection(sectionId),
    listSections(),
    listArticles({ sectionId, page, pageSize: PAGE_SIZE }),
  ]);
  if (!section) notFound();

  return (
    <>
      <PageHeader eyebrow="Section" title={section.title} description={`${section.articleCount} papers`}>
        <Breadcrumbs siteUrl={siteUrl()} items={[{ label: "Proceedings", href: "/confindex/1" }, { label: section.title }]} />
      </PageHeader>
      <Container className="grid gap-8 py-6 lg:grid-cols-[1fr_18rem] lg:gap-12 lg:py-10">
        <div>
          {result.items.length === 0 ? (
            <EmptyState
              title="No articles on this page"
              action={
                <Link href={`/innerindex/${section.id}`} className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 font-medium text-primary-foreground">
                  Go to first page
                </Link>
              }
            />
          ) : (
            <div className="rounded-lg border border-border bg-card px-4 sm:px-6">
              {result.items.map((a) => (
                <ArticleCard key={a.id} article={a} variant="row" showSection={false} />
              ))}
            </div>
          )}
          <DataPagination
            className="mt-6"
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            hrefFor={(p) => listingHref(`/innerindex/${section.id}`, { page: p })}
          />
        </div>
        <aside aria-labelledby="other-sections" className="lg:sticky lg:top-24 lg:self-start">
          <h2 id="other-sections" className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider text-gold-700">
            Other sections
          </h2>
          <ul className="divide-y divide-border rounded-lg border border-border bg-paper">
            {sections.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/innerindex/${s.id}`}
                  aria-current={s.id === section.id ? "page" : undefined}
                  className="flex min-h-11 items-center justify-between gap-3 px-4 py-2 text-sm hover:bg-accent aria-[current=page]:bg-accent aria-[current=page]:font-semibold"
                >
                  <span className="text-heritage-900">{s.title}</span>
                  <span className="text-xs text-muted-foreground">{s.articleCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </Container>
    </>
  );
}
