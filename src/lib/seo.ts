import "server-only";
import { siteUrl } from "@/lib/env";
import { SITE } from "@/lib/site";

// Shared pieces of the schema.org graph. Pages reference the organisation and the site by @id
// so crawlers merge them into one entity instead of seeing a new publisher on every page.

/** Media may already be absolute (MEDIA_BASE_URL); site paths are prefixed with the canonical origin. */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${siteUrl()}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export const organizationId = () => `${siteUrl()}/#organization`;
export const websiteId = () => `${siteUrl()}/#website`;
export const proceedingsId = () => `${siteUrl()}/confindex/${SITE.conferenceId}#proceedings`;

export function organizationLd() {
  const url = siteUrl();
  return {
    "@type": "Organization",
    "@id": organizationId(),
    name: SITE.name,
    alternateName: [SITE.nameMl, SITE.shortName],
    url,
    logo: { "@type": "ImageObject", url: `${url}/images/logo.png` },
    email: SITE.email,
    telephone: SITE.phone.replace(/\s/g, ""),
    address: {
      "@type": "PostalAddress",
      streetAddress: "Hira Centre, PB.833",
      addressLocality: "Kozhikode",
      addressRegion: "Kerala",
      addressCountry: "IN",
    },
    sameAs: [SITE.facebook],
  };
}

export function websiteLd() {
  const url = siteUrl();
  return {
    "@type": "WebSite",
    "@id": websiteId(),
    name: SITE.name,
    alternateName: SITE.nameMl,
    url,
    description: SITE.description,
    inLanguage: ["ml", "en"],
    publisher: { "@id": organizationId() },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${url}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

/** The printed volume every paper belongs to, published from the 2013 conference. */
export function proceedingsLd() {
  const { conference } = SITE;
  return {
    "@type": "Book",
    "@id": proceedingsId(),
    name: SITE.proceedingsTitle,
    alternateName: `${conference.name} Proceedings`,
    url: `${siteUrl()}/confindex/${SITE.conferenceId}`,
    inLanguage: "ml",
    publisher: { "@id": organizationId() },
    about: {
      "@type": "Event",
      name: conference.name,
      startDate: conference.startDate,
      endDate: conference.endDate,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: conference.venue,
        address: { "@type": "PostalAddress", addressLocality: conference.locality, addressRegion: "Kerala", addressCountry: "IN" },
      },
      organizer: { "@id": organizationId() },
    },
  };
}
