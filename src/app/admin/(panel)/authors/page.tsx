import Link from "next/link";
import { Suspense } from "react";
import { Pencil, Plus } from "lucide-react";
import { AdminFilters } from "@/components/admin/list-controls";
import { ListFooter, TableSkeleton } from "@/components/admin/list-footer";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/shared/states";
import { buttonVariants } from "@/components/ui/button";
import { adminHref, adminListParams, type AdminListParams } from "@/lib/admin/params";
import { listAdminAuthors } from "@/lib/queries/admin";

export const metadata = { title: "Authors" };

export default async function AdminAuthorsPage({ searchParams }: PageProps<"/admin/authors">) {
  const p = adminListParams.parse(await searchParams);
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Authors"
        crumbs={[{ label: "Authors" }]}
        actions={
          <Link href="/admin/authors/new" className={buttonVariants()}>
            <Plus className="size-4" aria-hidden="true" /> New author
          </Link>
        }
      />
      <AdminFilters searchLabel="Search by name or designation" />
      <Suspense key={JSON.stringify(p)} fallback={<TableSkeleton columns={3} rows={Math.min(p.pageSize, 20)} />}>
        <AuthorsTable params={p} />
      </Suspense>
    </div>
  );
}

async function AuthorsTable({ params }: { params: AdminListParams }) {
  const { rows, meta } = await listAdminAuthors({ q: params.q, page: params.page, pageSize: params.pageSize });
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No authors found"
        action={
          <Link href="/admin/authors" className={buttonVariants({ variant: "outline" })}>
            Clear search
          </Link>
        }
      />
    );
  }
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Name</th>
              <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">Designation</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Papers</th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((a) => (
              <tr key={a.id} className="hover:bg-muted/30">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    {a.photoKey ? (
                      // eslint-disable-next-line @next/next/no-img-element -- small avatar thumbnail
                      <img src={`/${a.photoKey}`} alt="" className="size-9 shrink-0 rounded-full object-cover" loading="lazy" />
                    ) : (
                      <span className="size-9 shrink-0 rounded-full bg-heritage-100" aria-hidden="true" />
                    )}
                    <Link href={`/admin/authors/${a.id}`} className="font-medium text-heritage-900 hover:underline">
                      {a.name}
                    </Link>
                  </div>
                </td>
                <td className="hidden max-w-sm px-4 py-2.5 text-muted-foreground md:table-cell">
                  <span className="line-clamp-1">{a.designation || "—"}</span>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{a.papers}</td>
                <td className="px-4 py-2.5 text-right">
                  <Link href={`/admin/authors/${a.id}`} className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label={`Edit ${a.name}`}>
                    <Pencil className="size-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ListFooter meta={meta} hrefFor={(page) => adminHref("/admin/authors", { ...params, page })} />
    </div>
  );
}
