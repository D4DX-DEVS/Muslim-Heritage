import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ListTree } from "lucide-react";
import { ArticleCard } from "@/components/site/article-card";
import { ReadingProgress, ShareBar } from "@/components/site/article-tools";
import { AuthorAvatar } from "@/components/site/author-card";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { JsonLd } from "@/components/site/json-ld";
import { getSession } from "@/lib/auth/session";
import { withHeadingIds } from "@/lib/content/toc";
import { siteUrl } from "@/lib/env";
import { withMediaBase } from "@/lib/media-url";
import { parseId } from "@/lib/params";
import { getArticle } from "@/lib/queries/public";
import { SITE } from "@/lib/site";

async function load(idParam: string, preview: boolean) {
  const id = parseId(idParam);
  if (!id) return null;
  // Drafts are only visible to a signed-in admin using the preview link.
  const includeDrafts = preview && (await getSession()) != null;
  return getArticle(id, { includeDrafts });
}

export async function generateMetadata({ params, searchParams }: PageProps<"/innermore/[id]">): Promise<Metadata> {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const data = await load(id, sp.preview === "1");
  if (!data) return { title: "Article not found" };
  const { article, authors, leadImage } = data;
  const description = article.seoDescription || article.summary;
  return {
    title: article.seoTitle || article.title,
    description,
    alternates: { canonical: `/innermore/${article.id}` },
    authors: authors.map((a) => ({ name: a.name, url: `/author/${a.id}` })),
    openGraph: {
      type: "article",
      title: article.title,
      description,
      url: `/innermore/${article.id}`,
      images: leadImage ? [{ url: leadImage.url, width: leadImage.width ?? undefined, height: leadImage.height ?? undefined }] : undefined,
    },
    robots: article.status !== "published" ? { index: false, follow: false } : undefined,
  };
}

export default async function ArticlePage({ params, searchParams }: PageProps<"/innermore/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const data = await load(id, sp.preview === "1");
  if (!data) notFound();
  const { article, authors, section, leadImage, prev, next, related } = data;
  const { html, toc } = withHeadingIds(withMediaBase(article.bodyHtml));
  const url = siteUrl();
  const canonical = `${url}/innermore/${article.id}`;

  return (
    <>
      <ReadingProgress />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ScholarlyArticle",
          headline: article.title,
          inLanguage: "ml",
          url: canonical,
          description: article.summary,
          image: leadImage ? `${url}${leadImage.url}` : undefined,
          author: authors.map((a) => ({ "@type": "Person", name: a.name, url: `${url}/author/${a.id}` })),
          isPartOf: { "@type": "Book", name: "കേരള മുസ്‌ലിം ഹിസ്റ്ററി കോണ്‍ഫറന്‍സ് പ്രബന്ധസമാഹാരം" },
          publisher: { "@type": "Organization", name: SITE.name, logo: { "@type": "ImageObject", url: `${url}/images/logo.png` } },
          dateModified: article.updatedAt,
        }}
      />

      {article.status !== "published" && (
        <div role="status" className="no-print bg-gold-200 px-4 py-2 text-center text-sm font-medium text-heritage-950">
          Draft preview — this article is not public.
        </div>
      )}

      <article className="pb-12 lg:pb-20">
        <div className="mx-auto max-w-(--container-page) px-4 pt-6 sm:px-6 lg:px-8 lg:pt-10">
          <div className="rounded-xl border border-border bg-card px-4 py-6 shadow-[0_1px_2px_rgb(11_46_34/0.04),0_12px_32px_-16px_rgb(11_46_34/0.18)] sm:px-8 sm:py-8 lg:px-12 lg:py-10">
            <header className="border-b border-border pb-6">
              <Breadcrumbs
                siteUrl={url}
                items={[
                  { label: "Proceedings", href: "/confindex/1" },
                  ...(section ? [{ label: section.title, href: `/innerindex/${section.id}` }] : []),
                  { label: article.title },
                ]}
              />
              {section && (
                <Link href={`/innerindex/${section.id}`} className="inline-block text-sm font-semibold text-gold-700 hover:underline">
                  {section.title}
                </Link>
              )}
              <h1 className="mt-2 font-heading text-[1.7rem] font-bold leading-snug text-heritage-900 sm:text-4xl" lang="ml">
                {article.title}
              </h1>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-3">
                  {authors.map((a) => (
                    <Link key={a.id} href={`/author/${a.id}`} className="group flex min-w-0 items-center gap-3">
                      <AuthorAvatar photo={a.photo} name={a.name} size={44} />
                      <span className="min-w-0">
                        <span className="block font-semibold text-heritage-900 group-hover:text-heritage-600">{a.name}</span>
                        {a.designation && <span className="block text-sm text-muted-foreground">{a.designation}</span>}
                      </span>
                    </Link>
                  ))}
                </div>
                <ShareBar url={canonical} title={article.title} />
              </div>
            </header>

            {leadImage && (
              <figure className="mt-8">
                <Image
                  src={leadImage.url}
                  alt={leadImage.alt}
                  width={leadImage.width ?? 800}
                  height={leadImage.height ?? 500}
                  priority
                  className="mx-auto h-auto max-h-[32rem] w-auto max-w-full rounded-lg"
                />
                {(leadImage.caption || leadImage.attribution) && (
                  <figcaption className="mt-2 text-center text-sm text-muted-foreground">
                    {leadImage.caption}
                    {leadImage.attribution && <span className="block text-xs">{leadImage.attribution}</span>}
                  </figcaption>
                )}
              </figure>
            )}

            {toc.length >= 3 && (
              <details className="no-print mt-8 rounded-lg border border-border bg-paper p-4 open:pb-5" open>
                <summary className="flex min-h-8 cursor-pointer items-center gap-2 font-heading font-semibold text-heritage-900">
                  <ListTree className="size-4 text-gold-600" aria-hidden="true" /> Contents
                </summary>
                <ol className="mt-3 space-y-1.5 text-sm">
                  {toc.map((t) => (
                    <li key={t.id} style={{ paddingInlineStart: `${(t.level - 2) * 0.75}rem` }}>
                      <a href={`#${t.id}`} className="text-heritage-700 hover:text-gold-700 hover:underline">
                        {t.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </details>
            )}

            {/* Stored HTML is sanitised on write (src/lib/content/sanitize.ts). */}
            <div className="prose-heritage mt-8" lang="ml" dangerouslySetInnerHTML={{ __html: html }} />

            {authors.length > 0 && (
              <aside className="mt-12 rounded-lg border border-border bg-paper p-4 sm:p-6" aria-label="About the author">
                {authors.map((a) => (
                  <div key={a.id} className="flex items-center gap-4">
                    <AuthorAvatar photo={a.photo} name={a.name} size={64} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gold-700">Author</p>
                      <Link href={`/author/${a.id}`} className="font-heading text-lg font-semibold text-heritage-900 hover:text-heritage-600">
                        {a.name}
                      </Link>
                      {a.designation && <p className="text-sm text-muted-foreground">{a.designation}</p>}
                    </div>
                  </div>
                ))}
              </aside>
            )}

            {(prev || next) && (
              <nav aria-label="Previous and next articles" className="no-print mt-10 grid gap-3 sm:grid-cols-2">
                {prev ? (
                  <Link
                    href={`/innermore/${prev.id}`}
                    className="group flex min-h-11 flex-col rounded-lg border border-border p-4 hover:border-gold-500"
                  >
                    <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <ArrowLeft className="size-3.5" aria-hidden="true" /> Previous
                    </span>
                    <span className="mt-1 line-clamp-2 font-heading font-medium text-heritage-900 group-hover:text-heritage-600">{prev.title}</span>
                  </Link>
                ) : (
                  <span className="hidden sm:block" />
                )}
                {next && (
                  <Link
                    href={`/innermore/${next.id}`}
                    className="group flex min-h-11 flex-col rounded-lg border border-border p-4 text-right hover:border-gold-500"
                  >
                    <span className="inline-flex items-center justify-end gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Next <ArrowRight className="size-3.5" aria-hidden="true" />
                    </span>
                    <span className="mt-1 line-clamp-2 font-heading font-medium text-heritage-900 group-hover:text-heritage-600">{next.title}</span>
                  </Link>
                )}
              </nav>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <section className="no-print mx-auto mt-14 max-w-(--container-page) px-4 sm:px-6 lg:px-8" aria-labelledby="related-heading">
            <h2 id="related-heading" className="mb-4 font-heading text-xl font-bold text-heritage-900">
              Related articles
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((r) => (
                <ArticleCard key={r.id} article={r} showSection={false} />
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
