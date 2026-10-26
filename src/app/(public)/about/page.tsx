import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { Container, PageHeader } from "@/components/site/page-header";
import { siteUrl } from "@/lib/env";
import { withMediaBase } from "@/lib/media-url";
import { getPage } from "@/lib/queries/public";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("about");
  return {
    title: page?.title ?? "About Us",
    description: page?.bodyHtml.replace(/<[^>]+>/g, " ").trim().slice(0, 160),
    alternates: { canonical: "/about" },
  };
}

export default async function AboutPage() {
  const page = await getPage("about");
  if (!page) notFound();
  return (
    <>
      <PageHeader eyebrow={page.title} title={page.heading || page.title}>
        <Breadcrumbs siteUrl={siteUrl()} items={[{ label: page.title }]} />
      </PageHeader>
      <Container className="grid gap-10 py-8 lg:grid-cols-[1fr_18rem] lg:py-12">
        {/* Sanitised when saved. */}
        <div className="prose-heritage max-w-(--container-prose)" lang="ml" dangerouslySetInnerHTML={{ __html: withMediaBase(page.bodyHtml) }} />
        <aside className="space-y-2 lg:sticky lg:top-24 lg:self-start">
          {[
            ["/director", "Director Board"],
            ["/advisory", "Advisory Board"],
            ["/contact", "Contact us"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="flex min-h-12 items-center justify-between rounded-lg border border-border bg-paper px-4 font-medium text-heritage-900 hover:border-gold-500">
              {label} <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          ))}
        </aside>
      </Container>
    </>
  );
}
