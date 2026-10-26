import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataPaginationProps {
  page: number;
  pageCount: number;
  total: number;
  /** Builds the URL for a page number, keeping current filters. */
  hrefFor: (page: number) => string;
  className?: string;
}

function pageWindow(page: number, pageCount: number): (number | "gap")[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

const item =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border px-3 text-sm transition-colors hover:bg-accent sm:min-h-9 sm:min-w-9";

export function DataPagination({ page, pageCount, total, hrefFor, className }: DataPaginationProps) {
  if (total === 0) return null;
  return (
    <nav aria-label="Pagination" className={cn("flex flex-col items-center gap-3 sm:flex-row sm:justify-between", className)}>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Page {page} of {pageCount} · {total} {total === 1 ? "result" : "results"}
      </p>
      {pageCount > 1 && (
        <ul className="flex flex-wrap items-center justify-center gap-1.5">
          <li>
            {page > 1 ? (
              <Link href={hrefFor(page - 1)} rel="prev" className={item} aria-label="Previous page">
                <ChevronLeft className="size-4" />
              </Link>
            ) : (
              <span className={cn(item, "pointer-events-none opacity-40")} aria-hidden="true">
                <ChevronLeft className="size-4" />
              </span>
            )}
          </li>
          {pageWindow(page, pageCount).map((p, i) =>
            p === "gap" ? (
              <li key={`gap-${i}`} className="px-1 text-muted-foreground" aria-hidden="true">
                …
              </li>
            ) : (
              <li key={p}>
                <Link
                  href={hrefFor(p)}
                  aria-current={p === page ? "page" : undefined}
                  className={cn(item, p === page && "border-primary bg-primary text-primary-foreground hover:bg-primary")}
                >
                  {p}
                </Link>
              </li>
            ),
          )}
          <li>
            {page < pageCount ? (
              <Link href={hrefFor(page + 1)} rel="next" className={item} aria-label="Next page">
                <ChevronRight className="size-4" />
              </Link>
            ) : (
              <span className={cn(item, "pointer-events-none opacity-40")} aria-hidden="true">
                <ChevronRight className="size-4" />
              </span>
            )}
          </li>
        </ul>
      )}
    </nav>
  );
}
