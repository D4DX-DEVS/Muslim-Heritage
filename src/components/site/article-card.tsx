import Image from "next/image";
import Link from "next/link";
import type { ArticleCard as ArticleCardData } from "@/lib/queries/public";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ArticleCardProps {
  article: ArticleCardData;
  variant?: "card" | "row";
  showSection?: boolean;
  priority?: boolean;
}

export function ArticleCard({ article, variant = "card", showSection = true, priority = false }: ArticleCardProps) {
  const href = `/innermore/${article.id}`;
  const authorNames = article.authors.map((a) => a.name).join(", ");

  if (variant === "row") {
    return (
      <article className="group relative flex gap-4 border-b border-border py-5 last:border-b-0">
        {article.image && (
          <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-muted sm:size-24">
            <Image src={article.image.url} alt="" fill sizes="96px" className="object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {showSection && article.section && <SectionLabel section={article.section} />}
          <h3 className="font-heading text-base font-semibold leading-snug text-heritage-900 sm:text-lg">
            <Link href={href} className="after:absolute after:inset-0 group-hover:text-heritage-700">
              {article.title}
            </Link>
          </h3>
          <Meta authorNames={authorNames} />
        </div>
      </article>
    );
  }

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-[box-shadow,transform] duration-(--duration-base) ease-(--ease-out) hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-12px_rgb(11_46_34/0.25)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {article.image ? (
          <Image
            src={article.image.url}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 ease-(--ease-out) group-hover:scale-[1.03]"
            priority={priority}
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--heritage-700),var(--heritage-950))]" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {showSection && article.section && <SectionLabel section={article.section} />}
        <h3 className="line-clamp-3 font-heading text-lg font-semibold leading-snug text-heritage-900">
          <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none group-hover:text-heritage-700">
            {article.title}
          </Link>
        </h3>
        {article.summary && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">{article.summary}</p>}
        <div className="mt-auto pt-4">
          <Meta authorNames={authorNames} />
        </div>
      </div>
    </article>
  );
}

function SectionLabel({ section }: { section: { id: number; title: string } }) {
  return (
    <Link
      href={`/innerindex/${section.id}`}
      className="relative z-10 mb-1.5 inline-block text-xs font-semibold tracking-wide text-gold-700 hover:underline"
    >
      {section.title}
    </Link>
  );
}

function Meta({ authorNames }: { authorNames: string }) {
  if (!authorNames) return null;
  return <p className="mt-1.5 text-xs font-medium text-ink-soft sm:text-sm">{authorNames}</p>;
}

export function ArticleCardSkeleton({ variant = "card" }: { variant?: "card" | "row" }) {
  if (variant === "row") {
    return (
      <div className="flex gap-4 border-b border-border py-5">
        <Skeleton className="size-20 shrink-0 sm:size-24" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Skeleton className="aspect-[16/10] rounded-none" />
      <div className="space-y-2.5 p-4 sm:p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-11/12" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-5/6" />
      </div>
    </div>
  );
}

export function ArticleGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3", className)}>{children}</div>;
}
