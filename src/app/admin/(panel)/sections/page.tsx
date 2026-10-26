import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/shared/states";
import { listAdminSections } from "@/lib/queries/admin";
import { NewSectionButton, SectionRowActions } from "./_components/section-controls";

export const metadata = { title: "Sections" };

export default async function AdminSectionsPage() {
  const rows = await listAdminSections();
  const nextOrder = Math.max(0, ...rows.map((r) => r.section.sortOrder)) + 1;
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Sections"
        description="Topic sections of the proceedings (legacy /innerindex pages)."
        crumbs={[{ label: "Sections" }]}
        actions={<NewSectionButton nextOrder={nextOrder} />}
      />
      {rows.length === 0 ? (
        <EmptyState title="No sections yet" description="Create the first section to group articles." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="w-16 px-4 py-3 font-medium">Order</th>
                <th scope="col" className="px-4 py-3 font-medium">Title</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Articles</th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(({ section, articles }) => (
                <tr key={section.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{section.sortOrder}</td>
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/articles?section=${section.id}`} className="font-medium text-heritage-900 hover:underline">
                      {section.title}
                    </Link>
                    <span className="ml-2 text-xs text-muted-foreground">#{section.id}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{articles}</td>
                  <td className="px-4 py-2.5">
                    <SectionRowActions
                      section={{ id: section.id, title: section.title, description: section.description, sortOrder: section.sortOrder, imageId: section.imageId, articles }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
