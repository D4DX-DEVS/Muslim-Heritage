import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArticleCard, ArticleCardSkeleton } from "@/components/site/article-card";
import { AuthorCard } from "@/components/site/author-card";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { ListingToolbar } from "@/components/site/listing-toolbar";
import { Container, PageHeader } from "@/components/site/page-header";
import { DataPagination } from "@/components/shared/data-pagination";
import { EmptyState } from "@/components/shared/states";
import { siteUrl } from "@/lib/env";
import { listingHref, parseListing, type ListingParams } from "@/lib/params";
import { listArticles, listAuthors, listSections } from "@/lib/queries/public";

const PAGE_SIZE = 10;

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const { q } = parseListing(await searchParams);
  return {
    title: q ? `Search: ${q}` : "Search",
    robots: { index: false, follow: true },
    alternates: { canonical: "/search" },
  };
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const p = parseListing(await searchParams);
  const sections = await listSections();
  return (
    <>
      <PageHeader eyebrow="Archive" title="Search" description="Search titles, authors and full text of every paper. Malayalam and English are both supported.">
        <Breadcrumbs siteUrl={siteUrl()} items={[{ label: "Search" }]} />
      </PageHeader>
      <Container className="space-y-6 py-6 lg:space-y-8 lg:py-10">
        <ListingToolbar searchLabel="Search the archive" sections={sections.map((s) => ({ value: String(s.id), label: s.title }))} />
        {p.q ? (
          <Suspense key={JSON.stringify(p)} fallback={<ResultsSkeleton />}>
            <Results params={p} />
          </Suspense>
        ) : (
          <EmptyState title="Start typing to search" description="Try a place, a person or a topic — for example മലബാര്‍, മമ്പുറം or Portuguese." />
        )}
      </Container>
    </>
  );
}

async function Results({ params }: { params: ListingParams }) {
  const [articles, authors] = await Promise.all([
    listArticles({ q: params.q, sectionId: params.section, page: params.page, pageSize: PAGE_SIZE }),
    params.page === 1 ? listAuthors({ q: params.q, page: 1, pageSize: 6 }) : Promise.resolve(null),
  ]);
  const nothing = articles.total === 0 && (!authors || authors.total === 0);
  if (nothing) {
    return (
      <EmptyState
        title={`No results for “${params.q}”`}
        description="Check the spelling, use fewer words, or search with at least three letters."
        action={
          <Link href="/articles" className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 font-medium text-primary-foreground">
            Browse all articles
          </Link>
        }
      />
    );
  }
  return (
    <div className="space-y-10">
      {authors && authors.total > 0 && (
        <section aria-labelledby="author-results">
          <h2 id="author-results" className="mb-3 font-heading text-lg font-semibold text-heritage-900">
            Authors <span className="text-sm font-normal text-muted-foreground">({authors.total})</span>
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {authors.items.map((a) => (
              <AuthorCard key={a.id} author={a} />
            ))}
          </div>
        </section>
      )}
      <section aria-labelledby="article-results">
        <h2 id="article-results" className="mb-1 font-heading text-lg font-semibold text-heritage-900">
          Articles <span className="text-sm font-normal text-muted-foreground">({articles.total})</span>
        </h2>
        {articles.items.length > 0 && (
          <div className="rounded-lg border border-border bg-card px-4 sm:px-6">
            {articles.items.map((a) => (
              <ArticleCard key={a.id} article={a} variant="row" />
            ))}
          </div>
        )}
        <DataPagination
          className="mt-6"
          page={articles.page}
          pageCount={articles.pageCount}
          total={articles.total}
          hrefFor={(page) => listingHref("/search", { q: params.q, section: params.section, page })}
        />
      </section>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div role="status" aria-label="Searching" className="rounded-lg border border-border bg-card px-4 sm:px-6">
      {Array.from({ length: 5 }, (_, i) => (
        <ArticleCardSkeleton key={i} variant="row" />
      ))}
    </div>
  );
}
