import { AdminPageHeader } from "@/components/admin/page-header";
import { pickerOptions } from "@/lib/queries/admin";
import { ArticleForm } from "../_components/article-form";

export const metadata = { title: "New article" };

export default async function NewArticlePage() {
  const { authors, sections } = await pickerOptions();
  return (
    <>
      <AdminPageHeader title="New article" crumbs={[{ label: "Articles", href: "/admin/articles" }, { label: "New" }]} />
      <ArticleForm
        id={null}
        status="draft"
        sections={sections}
        authors={authors}
        initial={{ title: "", summary: "", bodyHtml: "", sectionId: "none", authorIds: [], leadImage: null, featuredOrder: "", seoTitle: "", seoDescription: "" }}
      />
    </>
  );
}
