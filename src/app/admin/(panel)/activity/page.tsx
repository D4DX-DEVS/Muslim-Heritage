import { Suspense } from "react";
import { ListFooter, TableSkeleton } from "@/components/admin/list-footer";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/shared/states";
import { adminHref, adminListParams, type AdminListParams } from "@/lib/admin/params";
import { formatDateTime } from "@/lib/format";
import { listActivity } from "@/lib/queries/admin";

export const metadata = { title: "Activity log" };

export default async function ActivityPage({ searchParams }: PageProps<"/admin/activity">) {
  const p = adminListParams.parse(await searchParams);
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Activity log" description="Sign-ins and every content change, newest first." crumbs={[{ label: "Activity log" }]} />
      <Suspense key={JSON.stringify(p)} fallback={<TableSkeleton columns={4} rows={Math.min(p.pageSize, 20)} />}>
        <ActivityTable params={p} />
      </Suspense>
    </div>
  );
}

async function ActivityTable({ params }: { params: AdminListParams }) {
  const { rows, meta } = await listActivity({ page: params.page, pageSize: params.pageSize });
  if (rows.length === 0) return <EmptyState title="No activity yet" />;
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">When</th>
              <th scope="col" className="px-4 py-3 font-medium">Who</th>
              <th scope="col" className="px-4 py-3 font-medium">Action</th>
              <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">{formatDateTime(r.createdAt)}</td>
                <td className="px-4 py-2.5">{r.actor}</td>
                <td className="px-4 py-2.5">
                  <span className={r.action === "login_failed" ? "font-medium text-destructive" : ""}>{r.action.replace(/_/g, " ")}</span> {r.entity}
                  {r.entityId ? ` #${r.entityId}` : ""}
                </td>
                <td className="hidden max-w-md px-4 py-2.5 text-muted-foreground md:table-cell">
                  <span className="line-clamp-1">{r.detail}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ListFooter meta={meta} hrefFor={(page) => adminHref("/admin/activity", { pageSize: params.pageSize, page })} />
    </div>
  );
}
