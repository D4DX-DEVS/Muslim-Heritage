import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { NAV, SITE } from "@/lib/site";
import { MobileNav } from "./mobile-nav";
import { ScrollProgress } from "./scroll-progress";
import { NavLinks } from "./nav-links";

export function SiteHeader() {
  return (
    <header className="no-print sticky top-0 z-40 bg-heritage-900 text-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-gold-500 focus:px-3 focus:py-2 focus:text-heritage-950"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-(--container-page) items-center justify-between gap-4 px-4 sm:px-6 lg:h-18 lg:px-8">
        <Link href="/" className="shrink-0" aria-label={`${SITE.name} — home`}>
          <Image src="/images/logo.webp" alt={SITE.name} width={372} height={89} priority className="h-9 w-auto sm:h-11" />
        </Link>
        <nav aria-label="Main" className="hidden lg:block">
          <NavLinks items={NAV} />
        </nav>
        <div className="flex items-center gap-1">
          <Link
            href="/search"
            aria-label="Search the archive"
            className="inline-flex size-11 items-center justify-center rounded-md text-white/85 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Search className="size-5" />
          </Link>
          <MobileNav items={NAV} />
        </div>
      </div>
      <ScrollProgress />
    </header>
  );
}
