import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ArticleCard, ArticleGrid } from "@/components/site/article-card";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { JsonLd } from "@/components/site/json-ld";
import { Container, PageHeader } from "@/components/site/page-header";
import { PhotoGallery } from "@/components/site/photo-gallery";
import { siteUrl } from "@/lib/env";
import { parseId } from "@/lib/params";
import { featuredArticles, getConference, listSections } from "@/lib/queries/public";
import { organizationLd, proceedingsLd } from "@/lib/seo";
import { SITE } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/confindex/[id]">): Promise<Metadata> {
  const id = parseId((await params).id);
  const conf = id ? await getConference(id) : null;
  if (!conf) return { title: "Not found" };
  return {
    title: `${conf.title} ${conf.subtitle}`.trim(),
    description: "Proceedings of the Kerala Muslim History Conference, 22–24 December 2013, JDT Islam Campus, Kozhikode.",
    alternates: { canonical: `/confindex/${conf.id}` },
  };
}

export default async function ConferencePage({ params }: PageProps<"/confindex/[id]">) {
  const id = parseId((await params).id);
  if (!id) notFound();
  const [conf, featured, sections] = await Promise.all([getConference(id), featuredArticles(), listSections()]);
  if (!conf) notFound();

  return (
    <>
      {conf.id === SITE.conferenceId && (
        <JsonLd data={{ "@context": "https://schema.org", "@graph": [proceedingsLd(), organizationLd()] }} />
      )}
      <PageHeader
        eyebrow="Kerala Muslim History Conference · 22–24 December 2013 · Kozhikode"
        title={`${conf.title} — ${conf.subtitle}`}
        description={conf.description || undefined}
      >
        <Breadcrumbs siteUrl={siteUrl()} items={[{ label: "Proceedings" }]} />
      </PageHeader>

      <Container className="space-y-12 py-8 lg:space-y-16 lg:py-12">
        {featured.length > 0 && (
          <section aria-labelledby="intro-heading">
            <h2 id="intro-heading" className="mb-5 font-heading text-2xl font-bold text-heritage-900">
              ആമുഖം
            </h2>
            <ArticleGrid>
              {featured.map((a, i) => (
                <ArticleCard key={a.id} article={a} showSection={false} priority={i < 3} />
              ))}
            </ArticleGrid>
          </section>
        )}

        <section aria-labelledby="sections-heading">
          <h2 id="sections-heading" className="mb-5 font-heading text-2xl font-bold text-heritage-900">
            പ്രബന്ധസമാഹാരം <span className="text-base font-normal text-muted-foreground">· {sections.length} sections</span>
          </h2>
          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((s, i) => (
              <li key={s.id}>
                <Link
                  href={`/innerindex/${s.id}`}
                  className="group flex h-full items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-gold-500"
                >
                  <span className="font-heading text-lg font-bold text-gold-600">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1">
                    <span className="block font-heading font-semibold text-heritage-900 group-hover:text-heritage-600">{s.title}</span>
                    <span className="text-sm text-muted-foreground">{s.articleCount} papers</span>
                  </span>
                  <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>
        </section>

        {conf.slides.length + conf.gallery.length > 0 && (
          <section aria-labelledby="photos-heading">
            <h2 id="photos-heading" className="mb-5 font-heading text-2xl font-bold text-heritage-900">
              Photographs
            </h2>
            <PhotoGallery
              photos={[...conf.slides, ...conf.gallery].map((m, i) => ({ url: m.url, alt: m.alt ? `${m.alt} — photograph ${i + 1}` : `Conference photograph ${i + 1}` }))}
            />
          </section>
        )}
      </Container>
    </>
  );
}
