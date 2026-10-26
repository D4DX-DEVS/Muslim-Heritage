import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/page-header";
import { parseId } from "@/lib/params";
import { getArticleForEdit, pickerOptions } from "@/lib/queries/admin";
import { ArticleForm } from "../_components/article-form";
import { ArticleDangerZone, RevisionList } from "../_components/article-extras";

export const metadata = { title: "Edit article" };

export default async function EditArticlePage({ params }: PageProps<"/admin/articles/[id]">) {
  const id = parseId((await params).id);
  if (!id) notFound();
  const [data, { authors, sections }] = await Promise.all([getArticleForEdit(id), pickerOptions()]);
  if (!data) notFound();
  const { article, authorIds, revisions, leadImage } = data;

  return (
    <>
      <AdminPageHeader
        title="Edit article"
        description={`#${article.id} · ${article.title}`}
        crumbs={[{ label: "Articles", href: "/admin/articles" }, { label: `#${article.id}` }]}
      />
      <ArticleForm
        key={article.updatedAt}
        id={article.id}
        status={article.status}
        sections={sections}
        authors={authors}
        initial={{
          title: article.title,
          summary: article.summary,
          bodyHtml: article.bodyHtml,
          sectionId: article.sectionId ? String(article.sectionId) : "none",
          authorIds,
          leadImage: leadImage
            ? { id: leadImage.id, url: `/${leadImage.key}`, filename: leadImage.filename, mime: leadImage.mime, alt: leadImage.alt, width: leadImage.width, height: leadImage.height }
            : null,
          featuredOrder: article.featuredOrder ? String(article.featuredOrder) : "",
          seoTitle: article.seoTitle,
          seoDescription: article.seoDescription,
        }}
      />
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <RevisionList articleId={article.id} revisions={revisions} />
        <ArticleDangerZone id={article.id} title={article.title} status={article.status} />
      </div>
    </>
  );
}
