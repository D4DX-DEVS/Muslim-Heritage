import { HomeContents } from "@/components/site/home/contents";
import { HomeHero } from "@/components/site/home/hero";
import { HomeLetter } from "@/components/site/home/letter";
import { HomePhotographs } from "@/components/site/home/photographs";
import { HomeReading } from "@/components/site/home/reading";
import { StackSection } from "@/components/site/home/stack-section";
import { JsonLd } from "@/components/site/json-ld";
import { siteUrl } from "@/lib/env";
import { archiveStats, contentsBySection, featuredArticles, getConference, getPage } from "@/lib/queries/public";
import { SITE } from "@/lib/site";

// The homepage: the conference panorama holds as the first screen while the rest of the page slides up
// over it: where to begin, the contents index, the photographs, the foundation's close.
export default async function HomePage() {
  const [stats, featured, contents, conference, about] = await Promise.all([
    archiveStats(),
    featuredArticles(),
    contentsBySection(),
    getConference(SITE.conferenceId),
    getPage("about"),
  ]);
  const url = siteUrl();
  const slides = conference?.slides ?? [];
  const gallery = conference?.gallery ?? [];

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

      <StackSection depth={1}>
        <HomeHero
          title={conference?.title ?? "കേരള മുസ്‌ലിം ഹിസ്റ്ററി കോണ്‍ഫറന്‍സ്"}
          subtitle={conference?.subtitle || "പ്രബന്ധസമാഹാരം"}
          stats={stats}
          slides={slides.slice(0, 8)}
        />
      </StackSection>
      <div className="relative z-10">
        <HomeReading papers={featured} />
        {contents.length > 0 && <HomeContents sections={contents} />}
        {gallery.length > 0 && (
          <HomePhotographs photos={gallery.slice(0, 7)} total={slides.length + gallery.length} first={slides.length + 1} />
        )}
        <HomeLetter bodyHtml={about?.bodyHtml ?? ""} />
      </div>
    </>
  );
}
