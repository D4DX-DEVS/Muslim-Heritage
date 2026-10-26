import Image from "next/image";
import Link from "next/link";
import type { AuthorSummary } from "@/lib/queries/public";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthorAvatar({ photo, name, size = 56 }: { photo: AuthorSummary["photo"]; name: string; size?: number }) {
  return photo ? (
    <Image
      src={photo.url}
      alt={name}
      width={size}
      height={size}
      className="shrink-0 rounded-full border-2 border-gold-200 bg-muted object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full bg-heritage-100 font-heading font-semibold text-heritage-800"
      style={{ width: size, height: size }}
    >
      {[...name.trim()][0]}
    </span>
  );
}

export function AuthorCard({ author }: { author: AuthorSummary }) {
  return (
    <article className="group relative flex h-full items-center gap-4 rounded-lg border border-border bg-card p-4 transition-shadow duration-(--duration-base) hover:shadow-md">
      <AuthorAvatar photo={author.photo} name={author.name} />
      <div className="min-w-0">
        <h3 className="font-heading font-semibold leading-snug text-heritage-900">
          <Link href={`/author/${author.id}`} className="after:absolute after:inset-0 group-hover:text-heritage-700">
            {author.name}
          </Link>
        </h3>
        {author.designation && <p className="line-clamp-2 text-sm text-muted-foreground">{author.designation}</p>}
        <p className="mt-0.5 text-xs font-medium text-gold-700">
          {author.articleCount} {author.articleCount === 1 ? "paper" : "papers"}
        </p>
      </div>
    </article>
  );
}

export function AuthorCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
      <Skeleton className="size-14 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
