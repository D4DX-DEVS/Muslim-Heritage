import { DataPagination } from "@/components/shared/data-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import type { PageMeta } from "@/lib/queries/admin";
import { RowsPerPage } from "./list-controls";

export function ListFooter({ meta, hrefFor }: { meta: PageMeta; hrefFor: (page: number) => string }) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4 md:flex-row md:items-center md:justify-between">
      <RowsPerPage value={meta.pageSize} />
      <DataPagination page={meta.page} pageCount={meta.pageCount} total={meta.total} hrefFor={hrefFor} className="md:flex-1 md:justify-end md:gap-6" />
    </div>
  );
}

export function TableSkeleton({ columns, rows = 10 }: { columns: number; rows?: number }) {
  return (
    <div role="status" aria-label="Loading" className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex gap-4 border-b border-border bg-muted/50 px-4 py-3">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} className="h-3.5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex gap-4 border-b border-border px-4 py-3.5 last:border-b-0">
          {Array.from({ length: columns }, (_, i) => (
            <Skeleton key={i} className={`h-4 flex-1 ${i === 0 ? "max-w-[45%]" : ""}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const published = status === "published";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
        published ? "bg-heritage-100 text-heritage-800" : "bg-gold-200/60 text-gold-700"
      }`}
    >
      <span className={`size-1.5 rounded-full ${published ? "bg-heritage-600" : "bg-gold-600"}`} aria-hidden="true" />
      {published ? "Published" : "Draft"}
    </span>
  );
}
