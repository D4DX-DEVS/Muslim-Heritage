import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/site/article-card";
import { AuthorAvatar } from "@/components/site/author-card";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { JsonLd } from "@/components/site/json-ld";
import { Container } from "@/components/site/page-header";
import { EmptyState } from "@/components/shared/states";
import { siteUrl } from "@/lib/env";
import { parseId } from "@/lib/params";
import { getAuthor } from "@/lib/queries/public";

async function load(idParam: string) {
  const id = parseId(idParam);
  return id ? getAuthor(id) : null;
}

export async function generateMetadata({ params }: PageProps<"/author/[id]">): Promise<Metadata> {
  const data = await load((await params).id);
  if (!data) return { title: "Author not found" };
  const { author } = data;
  return {
    title: author.name,
    description: [author.designation, `${author.articleCount} papers in the Kerala Muslim History Conference proceedings.`].filter(Boolean).join(" — "),
    alternates: { canonical: `/author/${author.id}` },
    openGraph: { type: "profile", images: author.photo ? [author.photo.url] : undefined },
  };
}

export default async function AuthorPage({ params }: PageProps<"/author/[id]">) {
  const data = await load((await params).id);
  if (!data) notFound();
  const { author, articles } = data;
  const url = siteUrl();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: author.name,
          jobTitle: author.designation || undefined,
          url: `${url}/author/${author.id}`,
          image: author.photo ? `${url}${author.photo.url}` : undefined,
        }}
      />
      <div className="border-b border-border bg-paper">
        <Container className="py-8 lg:py-12">
          <Breadcrumbs siteUrl={url} items={[{ label: "Authors", href: "/authors" }, { label: author.name }]} />
          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
            <AuthorAvatar photo={author.photo} name={author.name} size={112} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">Author</p>
              <h1 className="mt-1 font-heading text-2xl font-bold text-heritage-900 sm:text-3xl">{author.name}</h1>
              {author.designation && <p className="mt-1 text-ink-soft">{author.designation}</p>}
              <p className="mt-2 text-sm font-medium text-gold-700">
                {author.articleCount} {author.articleCount === 1 ? "paper" : "papers"}
              </p>
            </div>
          </div>
          {author.bio && <p className="mt-6 max-w-3xl text-ink-soft">{author.bio}</p>}
        </Container>
      </div>
      <Container className="py-8 lg:py-12">
        <h2 className="mb-5 font-heading text-xl font-bold text-heritage-900">Papers</h2>
        {articles.length === 0 ? (
          <EmptyState title="No published papers yet" />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
