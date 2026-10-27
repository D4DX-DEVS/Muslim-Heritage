import type { Metadata } from "next";
import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { Container, PageHeader } from "@/components/site/page-header";
import { siteUrl } from "@/lib/env";
import { getPage } from "@/lib/queries/public";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Contact ${SITE.name}, Hira Centre, Kozhikode.`,
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const page = await getPage("contact");
  return (
    <>
      <PageHeader eyebrow="Get in touch" title={page?.title ?? "Contact Us"}>
        <Breadcrumbs siteUrl={siteUrl()} items={[{ label: "Contact" }]} />
      </PageHeader>
      <Container className="grid gap-8 py-8 md:grid-cols-[1fr_auto] lg:py-12">
        <div className="space-y-5">
          {page?.bodyHtml && (
            // Sanitised when saved.
            <div className="prose-heritage" dangerouslySetInnerHTML={{ __html: page.bodyHtml }} />
          )}
          <ul className="space-y-3">
            <li className="flex gap-3">
              <MapPin className="mt-1 size-5 shrink-0 text-gold-600" aria-hidden="true" />
              <span>{SITE.address.join(", ")}</span>
            </li>
            <li>
              <a href={`mailto:${SITE.email}`} className="inline-flex min-h-11 items-center gap-3 text-heritage-700 hover:underline">
                <Mail className="size-5 text-gold-600" aria-hidden="true" /> {SITE.email}
              </a>
            </li>
            <li>
              <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="inline-flex min-h-11 items-center gap-3 text-heritage-700 hover:underline">
                <Phone className="size-5 text-gold-600" aria-hidden="true" /> {SITE.phone}
              </a>
            </li>
          </ul>
        </div>
        <Image src="/images/hira.webp" alt="Hira Centre, Kozhikode" width={460} height={439} className="w-full max-w-sm rounded-lg border border-border" />
      </Container>
    </>
  );
}
