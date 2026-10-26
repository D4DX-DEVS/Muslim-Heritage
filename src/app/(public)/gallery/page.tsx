import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { Container, PageHeader } from "@/components/site/page-header";
import { PhotoGallery } from "@/components/site/photo-gallery";
import { siteUrl } from "@/lib/env";
import { getConference } from "@/lib/queries/public";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Photo gallery",
  description: "Photographs from the Kerala Muslim History Conference, December 2013, Kozhikode.",
  alternates: { canonical: "/gallery" },
};

// The legacy /gallery page returned HTTP 500; it now shows the conference photographs.
export default async function GalleryPage() {
  const conf = await getConference(SITE.conferenceId);
  if (!conf) notFound();
  const photos = [...conf.slides, ...conf.gallery];
  return (
    <>
      <PageHeader eyebrow="Conference" title="Photo gallery" description={`${photos.length} photographs`}>
        <Breadcrumbs siteUrl={siteUrl()} items={[{ label: "Gallery" }]} />
      </PageHeader>
      <Container className="py-8 lg:py-12">
        <PhotoGallery photos={photos.map((m, i) => ({ url: m.url, alt: `Kerala Muslim History Conference — photograph ${i + 1}` }))} />
      </Container>
    </>
  );
}
