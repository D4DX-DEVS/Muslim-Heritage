import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArticleCard, ArticleCardSkeleton, ArticleGrid } from "@/components/site/article-card";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { ListingToolbar } from "@/components/site/listing-toolbar";
import { Container, PageHeader } from "@/components/site/page-header";
import { DataPagination } from "@/components/shared/data-pagination";
import { EmptyState } from "@/components/shared/states";
import { siteUrl } from "@/lib/env";
import { listingHref, parseListing, type ListingParams } from "@/lib/params";
import { listArticles, listSections } from "@/lib/queries/public";

const PAGE_SIZE = 12;

export async function generateMetadata({ searchParams }: PageProps<"/articles">): Promise<Metadata> {
  const p = parseListing(await searchParams);
  return {
    title: p.page > 1 ? `Articles — page ${p.page}` : "Articles",
    description: "All research papers from the Kerala Muslim History Conference proceedings.",
    alternates: { canonical: listingHref("/articles", { page: p.page, section: p.section }) },
    // Search/sort permutations are not useful in the index.
    robots: p.q || p.sort !== "default" ? { index: false, follow: true } : undefined,
  };
}

export default async function ArticlesPage({ searchParams }: PageProps<"/articles">) {
  const p = parseListing(await searchParams);
  const sections = await listSections();
  return (
    <>
      <PageHeader
        eyebrow="Proceedings"
        title="Articles"
        description="Every paper in the Kerala Muslim History Conference proceedings. Search in Malayalam or English."
      >
        <Breadcrumbs siteUrl={siteUrl()} items={[{ label: "Articles" }]} />
      </PageHeader>
      <Container className="space-y-6 py-6 lg:space-y-8 lg:py-10">
        <ListingToolbar
          searchLabel="Search articles"
          sections={sections.map((s) => ({ value: String(s.id), label: s.title }))}
          sorts={[
            { value: "default", label: "Proceedings order" },
            { value: "title", label: "Title (A–Z)" },
            { value: "recent", label: "Recently updated" },
          ]}
        />
        <Suspense key={JSON.stringify(p)} fallback={<GridSkeleton />}>
          <Results params={p} />
        </Suspense>
      </Container>
    </>
  );
}

async function Results({ params }: { params: ListingParams }) {
  const result = await listArticles({ q: params.q, sectionId: params.section, sort: params.sort, page: params.page, pageSize: PAGE_SIZE });
  if (result.items.length === 0) {
    return (
      <EmptyState
        title={params.page > result.pageCount ? "This page doesn't exist" : "No articles found"}
        description={params.q ? `Nothing matched “${params.q}”. Try fewer or different words.` : "There are no articles for this filter."}
        action={
          <Link href="/articles" className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 font-medium text-primary-foreground">
            Clear filters
          </Link>
        }
      />
    );
  }
  return (
    <div className="space-y-8">
      <ArticleGrid>
        {result.items.map((a, i) => (
          <ArticleCard key={a.id} article={a} priority={i < 3} />
        ))}
      </ArticleGrid>
      <DataPagination
        page={result.page}
        pageCount={result.pageCount}
        total={result.total}
        hrefFor={(page) => listingHref("/articles", { ...params, page })}
      />
    </div>
  );
}

function GridSkeleton() {
  return (
    <div role="status" aria-label="Loading articles">
      <ArticleGrid>
        {Array.from({ length: 6 }, (_, i) => (
          <ArticleCardSkeleton key={i} />
        ))}
      </ArticleGrid>
    </div>
  );
}
