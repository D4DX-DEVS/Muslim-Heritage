import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { NAV, SITE } from "@/lib/site";

const linkCls = "inline-flex min-h-9 items-center text-white/75 transition-colors hover:text-white sm:min-h-0";

const EXPLORE = [...NAV.slice(1), { href: "/director", label: "Director Board" }, { href: "/advisory", label: "Advisory Board" }];

/** A compact close: the wordmark, the site's pages inline, the contacts, and the credits line. Phones get the wordmark, contacts and credits only; the pages are in the header menu. */
export function SiteFooter() {
  return (
    <footer className="no-print mt-auto bg-heritage-950 text-sm text-white/80 lg:sticky lg:bottom-0 lg:z-0">
      <div className="mx-auto max-w-(--container-page) px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_1.3fr_1.2fr] lg:gap-10">
          <div className="space-y-3">
            <Image src="/images/logo.webp" alt={SITE.name} width={372} height={89} className="h-10 w-auto" />
            <p className="hidden max-w-xs text-white/65 sm:block">Online edition of the Kerala Muslim History Conference proceedings.</p>
          </div>

          <nav aria-label="Footer" className="hidden sm:block">
            <ul className="flex flex-wrap gap-x-6 gap-y-1 lg:gap-y-2.5">
              {EXPLORE.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className={linkCls}>
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <address className="space-y-2 not-italic">
            <p className="hidden gap-2 sm:flex">
              <MapPin className="mt-1 size-4 shrink-0 text-gold-500" aria-hidden="true" />
              <span>{SITE.address.join(", ")}</span>
            </p>
            <p className="flex flex-wrap gap-x-5 gap-y-1">
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

        <div className="mt-5 flex flex-col gap-1 bg-white/5 px-4 py-3 text-xs text-white/60 sm:mt-6 sm:flex-row sm:justify-between sm:text-sm lg:mt-8">
          <p>
            © {new Date().getFullYear()} {SITE.name}
          </p>
          <p>
            Powered by{" "}
            <a
              href="https://d4dx.co"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white/80 underline decoration-gold-500/0 decoration-2 underline-offset-4 transition-[color,text-decoration-color] hover:text-white hover:decoration-gold-500"
            >
              D4DX Innovation LLP
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
