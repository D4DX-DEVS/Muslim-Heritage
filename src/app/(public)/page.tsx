import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Search, Users } from "lucide-react";
import { ArticleCard, ArticleGrid } from "@/components/site/article-card";
import { AuthorCard } from "@/components/site/author-card";
import { JsonLd } from "@/components/site/json-ld";
import { Container } from "@/components/site/page-header";
import { siteUrl } from "@/lib/env";
import { archiveStats, featuredArticles, getConference, getPage, listSections, prolificAuthors } from "@/lib/queries/public";
import { SITE } from "@/lib/site";

export default async function HomePage() {
  const [stats, featured, sections, authors, conference, about] = await Promise.all([
    archiveStats(),
    featuredArticles(),
    listSections(),
    prolificAuthors(6),
    getConference(SITE.conferenceId),
    getPage("about"),
  ]);
  const url = siteUrl();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: SITE.name,
          url,
          logo: `${url}/images/logo.png`,
          email: SITE.email,
          address: { "@type": "PostalAddress", streetAddress: "Hira Centre, PB.833", addressLocality: "Kozhikode", addressRegion: "Kerala", addressCountry: "IN" },
          sameAs: [SITE.facebook],
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-heritage-900 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:22px_22px]"
        />
        <Container className="relative grid items-center gap-8 py-10 sm:py-14 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-500">Kerala Muslim History Conference · 2013</p>
            <h1 className="mt-3 font-heading text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl" lang="ml">
              {conference?.title ?? "കേരള മുസ്‌ലിം ഹിസ്റ്ററി കോണ്‍ഫറന്‍സ്"}
              <span className="mt-1 block text-gold-500">{conference?.subtitle}</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/75 sm:text-lg">
              The online edition of the conference proceedings: research papers on the history, culture and public life of
              Kerala&apos;s Muslims.
            </p>
            <dl className="mt-6 grid max-w-md grid-cols-3 gap-3 border-y border-white/15 py-4">
              {[
                [stats.articles, "Papers"],
                [stats.authors, "Authors"],
                [stats.sections, "Sections"],
              ].map(([n, label]) => (
                <div key={label}>
                  <dt className="sr-only">{label}</dt>
                  <dd className="font-heading text-2xl font-bold text-white sm:text-3xl">{n}</dd>
                  <dd className="text-xs uppercase tracking-wider text-white/60">{label}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/confindex/1"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-gold-500 px-5 font-semibold text-heritage-950 transition-colors hover:bg-gold-200"
              >
                <BookOpen className="size-5" aria-hidden="true" />
                Browse the proceedings
              </Link>
              <Link
                href="/search"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/25 px-5 font-semibold text-white transition-colors hover:bg-white/10"
              >
                <Search className="size-5" aria-hidden="true" />
                Search the archive
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-3 -z-0 rounded-xl border border-gold-500/30" aria-hidden="true" />
            <Image
              src="/images/conf1.jpg"
              alt="History Conference, 22–24 December 2013, JDT Islam Campus, Kozhikode — 3 days, 26 sessions, 200 papers"
              width={477}
              height={265}
              priority
              className="relative w-full rounded-lg shadow-2xl"
            />
          </div>
        </Container>
      </section>

      {/* Featured introductions */}
      {featured.length > 0 && (
        <section className="py-10 lg:py-16" aria-labelledby="featured-heading">
          <Container>
            <SectionHeading id="featured-heading" eyebrow="Introduction" title="ആമുഖം" href="/confindex/1" linkLabel="All proceedings" />
            <ArticleGrid>
              {featured.map((a, i) => (
                <ArticleCard key={a.id} article={a} showSection={false} priority={i < 3} />
              ))}
            </ArticleGrid>
          </Container>
        </section>
      )}

      {/* Topics */}
      <section className="border-y border-border bg-paper py-10 lg:py-16" aria-labelledby="topics-heading">
        <Container>
          <SectionHeading id="topics-heading" eyebrow="Browse by topic" title="പ്രബന്ധസമാഹാരം" href="/articles" linkLabel="All articles" />
          <ol className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((s, i) => (
              <li key={s.id} className="border-b border-border">
                <Link href={`/innerindex/${s.id}`} className="group flex min-h-14 items-center gap-3 py-3">
                  <span className="w-7 shrink-0 font-heading text-sm font-semibold text-gold-600">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1 font-heading font-medium text-heritage-900 group-hover:text-heritage-600">{s.title}</span>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{s.articleCount}</span>
                </Link>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Authors */}
      {authors.length > 0 && (
        <section className="py-10 lg:py-16" aria-labelledby="authors-heading">
          <Container>
            <SectionHeading id="authors-heading" eyebrow="Contributors" title="Authors & researchers" href="/authors" linkLabel="All authors" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {authors.map((a) => (
                <AuthorCard key={a.id} author={a} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Conference photographs */}
      {conference && conference.slides.length > 0 && (
        <section className="bg-heritage-950 py-10 lg:py-14" aria-labelledby="photos-heading">
          <Container>
            <SectionHeading id="photos-heading" eyebrow="Conference" title="Photographs" href="/gallery" linkLabel="View gallery" dark />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {conference.slides.slice(0, 8).map((m, i) => (
                <div key={m.url} className={`relative overflow-hidden rounded-md bg-heritage-900 ${i === 0 ? "col-span-2 row-span-2 aspect-square sm:aspect-auto" : "aspect-[4/3]"}`}>
                  <Image src={m.url} alt={`Kerala Muslim History Conference, photograph ${i + 1}`} fill sizes="(min-width: 640px) 25vw, 50vw" className="object-cover" />
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* About */}
      <section className="py-10 lg:py-16" aria-labelledby="about-heading">
        <Container className="grid gap-8 lg:grid-cols-[2fr_1fr] lg:gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">About the foundation</p>
            <h2 id="about-heading" className="mt-2 font-heading text-2xl font-bold text-heritage-900 sm:text-3xl" lang="ml">
              {about?.heading || SITE.nameMl}
            </h2>
            <p className="mt-4 line-clamp-6 text-ink-soft" lang="ml">
              {about?.bodyHtml.replace(/<[^>]+>/g, " ").trim()}
            </p>
            <Link href="/about" className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-heritage-700 hover:text-gold-700">
              Read more <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="space-y-3 self-start rounded-lg border border-border bg-paper p-4 sm:p-6">
            <h3 className="flex items-center gap-2 font-heading font-semibold text-heritage-900">
              <Users className="size-5 text-gold-600" aria-hidden="true" /> The people behind the conference
            </h3>
            <Link href="/director" className="flex min-h-11 items-center justify-between rounded-md px-3 hover:bg-accent">
              Director Board <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href="/advisory" className="flex min-h-11 items-center justify-between rounded-md px-3 hover:bg-accent">
              Advisory Board <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href="/contact" className="flex min-h-11 items-center justify-between rounded-md px-3 hover:bg-accent">
              Contact us <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}

interface SectionHeadingProps {
  id: string;
  eyebrow: string;
  title: string;
  href: string;
  linkLabel: string;
  dark?: boolean;
}

function SectionHeading({ id, eyebrow, title, href, linkLabel, dark = false }: SectionHeadingProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 lg:mb-8">
      <div>
        <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${dark ? "text-gold-500" : "text-gold-700"}`}>{eyebrow}</p>
        <h2 id={id} className={`mt-1 font-heading text-2xl font-bold sm:text-3xl ${dark ? "text-white" : "text-heritage-900"}`}>
          {title}
        </h2>
      </div>
      <Link
        href={href}
        className={`inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold ${dark ? "text-white/80 hover:text-white" : "text-heritage-700 hover:text-gold-700"}`}
      >
        {linkLabel} <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
