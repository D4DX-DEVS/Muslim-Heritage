import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthorCard, AuthorCardSkeleton } from "@/components/site/author-card";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { ListingToolbar } from "@/components/site/listing-toolbar";
import { Container, PageHeader } from "@/components/site/page-header";
import { DataPagination } from "@/components/shared/data-pagination";
import { EmptyState } from "@/components/shared/states";
import { siteUrl } from "@/lib/env";
import { listingHref, parseListing, type ListingParams } from "@/lib/params";
import { listAuthors } from "@/lib/queries/public";

const PAGE_SIZE = 24;

export async function generateMetadata({ searchParams }: PageProps<"/authors">): Promise<Metadata> {
  const p = parseListing(await searchParams);
  return {
    title: p.page > 1 ? `Authors — page ${p.page}` : "Authors",
    description: "Historians, researchers and writers who contributed to the Kerala Muslim History Conference proceedings.",
    alternates: { canonical: listingHref("/authors", { page: p.page }) },
    robots: p.q ? { index: false, follow: true } : undefined,
  };
}

export default async function AuthorsPage({ searchParams }: PageProps<"/authors">) {
  const p = parseListing(await searchParams);
  return (
    <>
      <PageHeader eyebrow="Contributors" title="Authors & researchers">
        <Breadcrumbs siteUrl={siteUrl()} items={[{ label: "Authors" }]} />
      </PageHeader>
      <Container className="space-y-6 py-6 lg:space-y-8 lg:py-10">
        <ListingToolbar searchLabel="Find an author" />
        <Suspense key={`${p.q}-${p.page}`} fallback={<AuthorsSkeleton />}>
          <Results params={p} />
        </Suspense>
      </Container>
    </>
  );
}

async function Results({ params }: { params: ListingParams }) {
  const result = await listAuthors({ q: params.q, page: params.page, pageSize: PAGE_SIZE });
  if (result.items.length === 0) {
    return (
      <EmptyState
        title="No authors found"
        description={params.q ? `No author matched “${params.q}”.` : undefined}
        action={
          <Link href="/authors" className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 font-medium text-primary-foreground">
            Clear search
          </Link>
        }
      />
    );
  }
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {result.items.map((a) => (
          <AuthorCard key={a.id} author={a} />
        ))}
      </div>
      <DataPagination page={result.page} pageCount={result.pageCount} total={result.total} hrefFor={(page) => listingHref("/authors", { q: params.q, page })} />
    </div>
  );
}

function AuthorsSkeleton() {
  return (
    <div role="status" aria-label="Loading authors" className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {Array.from({ length: 9 }, (_, i) => (
        <AuthorCardSkeleton key={i} />
      ))}
    </div>
  );
}
