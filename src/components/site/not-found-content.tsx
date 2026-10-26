import Link from "next/link";
import { Search } from "lucide-react";

export function NotFoundContent() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center sm:py-24">
      <p className="font-heading text-6xl font-bold text-gold-500">404</p>
      <h1 className="mt-4 font-heading text-2xl font-bold text-heritage-900 sm:text-3xl">This page could not be found</h1>
      <p className="mt-3 text-ink-soft" lang="ml">
        ക്ഷമിക്കണം, നിങ്ങൾ തിരയുന്ന പേജ് കണ്ടെത്താനായില്ല. It may have moved, or the link may be mistyped.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 font-semibold text-primary-foreground hover:bg-heritage-700">
          Go to the homepage
        </Link>
        <Link href="/search" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border px-5 font-semibold text-heritage-800 hover:bg-accent">
          <Search className="size-4" aria-hidden="true" /> Search the archive
        </Link>
      </div>
    </div>
  );
}
