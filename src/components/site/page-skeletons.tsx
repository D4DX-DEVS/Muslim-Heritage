import { ArticleCardSkeleton, ArticleGrid } from "@/components/site/article-card";
import { AuthorCardSkeleton } from "@/components/site/author-card";
import { Container } from "@/components/site/page-header";
import { Skeleton } from "@/components/ui/skeleton";

// Route-level loading states (each route's loading.tsx renders one of these while the
// server streams the page). Shapes follow the real layouts so nothing jumps on arrival.

/** The title band shared by archive pages: breadcrumbs, eyebrow, title and a line of description. */
export function PageHeaderSkeleton() {
  return (
    <div className="border-b border-border bg-paper">
      <Container className="py-8 lg:py-12">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="mt-6 h-3 w-56" />
        <Skeleton className="mt-3 h-8 w-2/3 max-w-xl sm:h-10" />
        <Skeleton className="mt-4 h-4 w-1/2 max-w-md" />
      </Container>
    </div>
  );
}

function Loading({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-label={label}>
      {children}
    </div>
  );
}

export function ArticleGridPageSkeleton({ label = "Loading articles" }: { label?: string }) {
  return (
    <Loading label={label}>
      <PageHeaderSkeleton />
      <Container className="space-y-6 py-6 lg:space-y-8 lg:py-10">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Skeleton className="h-11 flex-1" />
          <Skeleton className="h-11 sm:w-48" />
          <Skeleton className="h-11 sm:w-48" />
        </div>
        <ArticleGrid>
          {Array.from({ length: 6 }, (_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </ArticleGrid>
      </Container>
    </Loading>
  );
}

export function SectionPageSkeleton() {
  return (
    <Loading label="Loading section">
      <PageHeaderSkeleton />
      <Container className="grid gap-8 py-6 lg:grid-cols-[1fr_18rem] lg:gap-12 lg:py-10">
        <div className="rounded-lg border border-border bg-card px-4 sm:px-6">
          {Array.from({ length: 6 }, (_, i) => (
            <ArticleCardSkeleton key={i} variant="row" />
          ))}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-32" />
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </Container>
    </Loading>
  );
}

export function AuthorsPageSkeleton() {
  return (
    <Loading label="Loading authors">
      <PageHeaderSkeleton />
      <Container className="space-y-6 py-6 lg:space-y-8 lg:py-10">
        <Skeleton className="h-11 w-full max-w-md" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {Array.from({ length: 9 }, (_, i) => (
            <AuthorCardSkeleton key={i} />
          ))}
        </div>
      </Container>
    </Loading>
  );
}

export function AuthorPageSkeleton() {
  return (
    <Loading label="Loading author">
      <div className="border-b border-border bg-paper">
        <Container className="py-8 lg:py-12">
          <Skeleton className="h-3.5 w-40" />
          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
            <Skeleton className="size-28 shrink-0 rounded-full" />
            <div className="w-full space-y-3">
              <Skeleton className="h-8 w-1/2 max-w-sm" />
              <Skeleton className="h-4 w-1/3 max-w-xs" />
              <Skeleton className="h-3.5 w-20" />
            </div>
          </div>
        </Container>
      </div>
      <Container className="py-8 lg:py-12">
        <Skeleton className="mb-5 h-6 w-28" />
        <ArticleGrid>
          {Array.from({ length: 3 }, (_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </ArticleGrid>
      </Container>
    </Loading>
  );
}

export function ArticlePageSkeleton() {
  return (
    <Loading label="Loading article">
      <Container className="pb-12 pt-6 lg:pb-20 lg:pt-10">
        <div className="rounded-xl border border-border bg-card px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10">
          <Skeleton className="h-3.5 w-48" />
          <Skeleton className="mt-6 h-3.5 w-32" />
          <Skeleton className="mt-3 h-9 w-11/12" />
          <Skeleton className="mt-2 h-9 w-2/3" />
          <div className="mt-6 flex items-center gap-3">
            <Skeleton className="size-11 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="mx-auto mt-8 aspect-[16/9] w-full max-w-3xl" />
          <div className="mx-auto mt-8 max-w-(--container-prose) space-y-3">
            {Array.from({ length: 12 }, (_, i) => (
              <Skeleton key={i} className={`h-4 ${i % 4 === 3 ? "w-3/5" : "w-full"}`} />
            ))}
          </div>
        </div>
      </Container>
    </Loading>
  );
}

export function GalleryPageSkeleton() {
  return (
    <Loading label="Loading photographs">
      <PageHeaderSkeleton />
      <Container className="py-8 lg:py-12">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
          {Array.from({ length: 12 }, (_, i) => (
            <Skeleton key={i} className="aspect-[4/3] w-full" />
          ))}
        </div>
      </Container>
    </Loading>
  );
}

export function ProceedingsPageSkeleton() {
  return (
    <Loading label="Loading proceedings">
      <PageHeaderSkeleton />
      <Container className="space-y-12 py-8 lg:space-y-16 lg:py-12">
        <div>
          <Skeleton className="mb-5 h-7 w-32" />
          <ArticleGrid>
            {Array.from({ length: 3 }, (_, i) => (
              <ArticleCardSkeleton key={i} />
            ))}
          </ArticleGrid>
        </div>
        <div>
          <Skeleton className="mb-5 h-7 w-48" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }, (_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </Container>
    </Loading>
  );
}

/** Text pages: about, contact and the two boards. */
export function TextPageSkeleton() {
  return (
    <Loading label="Loading page">
      <PageHeaderSkeleton />
      <Container className="grid gap-10 py-8 lg:grid-cols-[1fr_22rem] lg:py-12">
        <div className="max-w-(--container-prose) space-y-3">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className={`h-4 ${i % 5 === 4 ? "w-1/2" : "w-full"}`} />
          ))}
        </div>
        <Skeleton className="aspect-square w-full" />
      </Container>
    </Loading>
  );
}

/** The homepage banner: photograph band and title on phones, one full screen on desktop. */
export function HomePageSkeleton() {
  return (
    <Loading label="Loading">
      <div className="flex flex-col bg-heritage-950 lg:min-h-[calc(100svh-4.5rem)] lg:justify-end">
        <Skeleton className="skeleton-dark aspect-[16/10] w-full rounded-none sm:aspect-[16/8] lg:hidden" />
        <Container className="w-full pb-12 pt-8 lg:pt-32">
          <Skeleton className="skeleton-dark h-14 w-3/4 max-w-3xl sm:h-20" />
          <Skeleton className="skeleton-dark mt-4 h-14 w-2/3 max-w-2xl sm:h-20" />
          <Skeleton className="skeleton-dark mt-8 h-6 w-1/2 max-w-md" />
          <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="skeleton-dark h-16" />
            ))}
          </div>
        </Container>
      </div>
    </Loading>
  );
}
