import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { listSections } from "@/lib/queries/public";
import { NAV, SITE } from "@/lib/site";

const linkCls = "inline-flex min-h-9 items-center text-white/75 transition-colors hover:text-white sm:min-h-0";

export async function SiteFooter() {
  const sections = (await listSections()).slice(0, 6);
  return (
    <footer className="no-print mt-auto bg-heritage-950 text-sm text-white/80">
      <div className="mx-auto max-w-(--container-page) px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr_1.3fr_1.2fr] lg:gap-10">
          <div className="space-y-3">
            <Image src="/images/logo.png" alt={SITE.name} width={372} height={89} className="h-10 w-auto" />
            <p className="max-w-sm text-white/65">{SITE.description}</p>
          </div>

          {/* Secondary groups collapse on mobile to keep the footer short. */}
          <FooterGroup title="Explore">
            {NAV.slice(1).map((n) => (
              <li key={n.href}>
                <Link href={n.href} className={linkCls}>
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/director" className={linkCls}>Director Board</Link>
            </li>
            <li>
              <Link href="/advisory" className={linkCls}>Advisory Board</Link>
            </li>
          </FooterGroup>

          <FooterGroup title="Topics">
            {sections.map((s) => (
              <li key={s.id}>
                <Link href={`/innerindex/${s.id}`} className={linkCls}>
                  {s.title}
                </Link>
              </li>
            ))}
          </FooterGroup>

          <address className="space-y-2 not-italic">
            <p className="flex gap-2">
              <MapPin className="mt-1 size-4 shrink-0 text-gold-500" aria-hidden="true" />
              <span>{SITE.address.join(", ")}</span>
            </p>
            <p className="flex flex-wrap gap-x-5 gap-y-2">
              <a href={`mailto:${SITE.email}`} className={`${linkCls} gap-2`}>
                <Mail className="size-4 text-gold-500" aria-hidden="true" />
                {SITE.email}
              </a>
              <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className={`${linkCls} gap-2`}>
                <Phone className="size-4 text-gold-500" aria-hidden="true" />
                {SITE.phone}
              </a>
              <a href={SITE.facebook} target="_blank" rel="noopener noreferrer" className={`${linkCls} gap-2`}>
                <ExternalLink className="size-4 text-gold-500" aria-hidden="true" />
                Facebook
              </a>
            </p>
          </address>
        </div>
        <div className="mt-6 flex flex-col gap-1 border-t border-white/10 pt-4 text-xs text-white/50 sm:flex-row sm:justify-between lg:mt-10">
          <p>© {new Date().getFullYear()} {SITE.name}. Kerala Muslim History Conference.</p>
          <p lang="ml">{SITE.nameMl}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <details className="group border-y border-white/10 lg:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between font-heading font-semibold text-white">
          {title}
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <ul className="grid grid-cols-2 gap-x-4 pb-3">{children}</ul>
      </details>
      <div className="hidden lg:block">
        <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider text-gold-500">{title}</h2>
        <ul className="space-y-2">{children}</ul>
      </div>
    </>
  );
}
