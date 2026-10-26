import Link from "next/link";
import { Suspense } from "react";
import { Eye, Pencil, Plus } from "lucide-react";
import { AdminFilters } from "@/components/admin/list-controls";
import { ListFooter, StatusBadge, TableSkeleton } from "@/components/admin/list-footer";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/shared/states";
import { buttonVariants } from "@/components/ui/button";
import { adminHref, adminListParams, type AdminListParams } from "@/lib/admin/params";
import { formatDateTime } from "@/lib/format";
import { listAdminArticles, pickerOptions } from "@/lib/queries/admin";

export const metadata = { title: "Articles" };

export default async function AdminArticlesPage({ searchParams }: PageProps<"/admin/articles">) {
  const p = adminListParams.parse(await searchParams);
  const { sections } = await pickerOptions();
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Articles"
        crumbs={[{ label: "Articles" }]}
        actions={
          <Link href="/admin/articles/new" className={buttonVariants()}>
            <Plus className="size-4" aria-hidden="true" /> New article
          </Link>
        }
      />
      <AdminFilters
        searchLabel="Search by title or ID"
        filters={[
          {
            param: "status",
            label: "Status",
            allLabel: "All statuses",
            options: [
              { value: "published", label: "Published" },
              { value: "draft", label: "Draft" },
            ],
          },
          { param: "section", label: "Section", allLabel: "All sections", options: sections.map((s) => ({ value: String(s.id), label: s.title })) },
        ]}
      />
      <Suspense key={JSON.stringify(p)} fallback={<TableSkeleton columns={5} rows={p.pageSize > 20 ? 20 : p.pageSize} />}>
        <ArticlesTable params={p} />
      </Suspense>
    </div>
  );
}

async function ArticlesTable({ params }: { params: AdminListParams }) {
  const { rows, meta } = await listAdminArticles({ q: params.q, status: params.status, sectionId: params.section, page: params.page, pageSize: params.pageSize });
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No articles match"
        description="Try a different search or clear the filters."
        action={
          <Link href="/admin/articles" className={buttonVariants({ variant: "outline" })}>
            Clear filters
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
              <th scope="col" className="px-4 py-3 font-medium">Title</th>
              <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">Section</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="hidden px-4 py-3 font-medium lg:table-cell">Updated</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((a) => (
              <tr key={a.id} className="hover:bg-muted/30">
                <td className="max-w-md px-4 py-3">
                  <Link href={`/admin/articles/${a.id}`} className="line-clamp-2 font-medium text-heritage-900 hover:underline">
                    {a.title}
                  </Link>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    #{a.id} · {a.authors.join(", ") || "No author"}
                  </p>
                </td>
                <td className="hidden max-w-56 px-4 py-3 text-muted-foreground md:table-cell">
                  <span className="line-clamp-2">{a.section ?? "—"}</span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={a.status} />
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground lg:table-cell">{formatDateTime(a.updatedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Link href={`/admin/articles/${a.id}`} className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label={`Edit ${a.title}`}>
                      <Pencil className="size-4" />
                    </Link>
                    <a
                      href={`/innermore/${a.id}${a.status === "draft" ? "?preview=1" : ""}`}
                      target="_blank"
                      rel="noopener"
                      className={buttonVariants({ variant: "ghost", size: "icon" })}
                      aria-label={`View ${a.title}`}
                    >
                      <Eye className="size-4" />
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ListFooter meta={meta} hrefFor={(page) => adminHref("/admin/articles", { ...params, page })} />
    </div>
  );
}
