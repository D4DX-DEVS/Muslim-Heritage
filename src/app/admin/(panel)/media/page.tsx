import Link from "next/link";
import { Suspense } from "react";
import { AdminFilters } from "@/components/admin/list-controls";
import { ListFooter } from "@/components/admin/list-footer";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/shared/states";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminHref, adminListParams, type AdminListParams } from "@/lib/admin/params";
import { listMedia } from "@/lib/queries/admin";
import { MediaGrid, UploadToLibrary } from "./_components/media-grid";

export const metadata = { title: "Media library" };

export default async function AdminMediaPage({ searchParams }: PageProps<"/admin/media">) {
  const p = adminListParams.parse(await searchParams);
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Media library"
        description="Images and documents stored in Cloudflare R2. JPEG, PNG, WebP, GIF or PDF, up to 10 MB."
        crumbs={[{ label: "Media" }]}
        actions={<UploadToLibrary />}
      />
      <AdminFilters
        searchLabel="Search filename, alt text or caption"
        filters={[
          {
            param: "type",
            label: "Type",
            allLabel: "All files",
            options: [
              { value: "image", label: "Images" },
              { value: "pdf", label: "PDF documents" },
            ],
          },
        ]}
      />
      <Suspense key={JSON.stringify(p)} fallback={<GridSkeleton />}>
        <Results params={p} />
      </Suspense>
    </div>
  );
}

async function Results({ params }: { params: AdminListParams }) {
  const { rows, meta } = await listMedia({ q: params.q, type: params.type, page: params.page, pageSize: params.pageSize });
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No files found"
        action={
          <Link href="/admin/media" className={buttonVariants({ variant: "outline" })}>
            Clear filters
          </Link>
        }
      />
    );
  }
  return (
    <div className="space-y-4">
      <MediaGrid items={rows} />
      <ListFooter meta={meta} hrefFor={(page) => adminHref("/admin/media", { ...params, page })} />
    </div>
  );
}

function GridSkeleton() {
  return (
    <div role="status" aria-label="Loading media" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-lg border border-border bg-card">
          <Skeleton className="aspect-square rounded-none" />
          <div className="space-y-1.5 p-2">
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
