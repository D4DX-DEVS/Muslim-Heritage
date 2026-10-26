import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/shared/states";
import { listPages } from "@/lib/queries/admin";
import { PageForm } from "./_components/page-form";

export const metadata = { title: "Static pages" };

export default async function AdminPagesPage() {
  const pages = (await listPages()).filter((p): p is typeof p & { slug: "about" | "contact" } => p.slug === "about" || p.slug === "contact");
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Static pages"
        description="About and Contact. Address, phone and email in the footer come from the site configuration."
        crumbs={[{ label: "Static pages" }]}
      />
      {pages.length === 0 && <EmptyState title="No pages found" description="Run the migration import to create the About and Contact pages." />}
      {pages.map((p) => (
        <section key={p.slug} aria-labelledby={`${p.slug}-section`} className="space-y-2">
          <h2 id={`${p.slug}-section`} className="font-heading text-lg font-semibold capitalize text-heritage-900">
            {p.slug}
          </h2>
          <PageForm slug={p.slug} initial={{ title: p.title, heading: p.heading, bodyHtml: p.bodyHtml }} />
        </section>
      ))}
    </div>
  );
}
