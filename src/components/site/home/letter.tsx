import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { htmlToText } from "@/lib/content/text";
import { SITE } from "@/lib/site";

/** The foundation's close: its name set large beside the opening of its note. Contacts live in the footer below. */
export function HomeLetter({ bodyHtml }: { bodyHtml: string }) {
  const paragraph = (bodyHtml.match(/<p[^>]*>[\s\S]*?<\/p>/g) ?? []).map(htmlToText).find(Boolean) ?? "";

  return (
    <section aria-labelledby="about-heading" className="bg-heritage-900 py-16 text-white sm:py-20 lg:py-24">
      <div className="mx-auto grid max-w-(--container-page) grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8">
        <h2
          id="about-heading"
          lang="ml"
          data-reveal="mask"
          className="font-heading text-[clamp(1.625rem,2.8vw,2.5rem)] font-bold leading-[1.2] tracking-[-0.02em] lg:col-span-6"
        >
          {SITE.nameMl}
        </h2>

        <div data-reveal style={{ "--i": 1 } as React.CSSProperties} className="lg:col-span-6">
          {paragraph && (
            <p lang="ml" className="line-clamp-4 text-[1.0625rem] sm:line-clamp-6 leading-[1.85] text-white">
              {paragraph}
            </p>
          )}
          <Link
            href="/about"
            className="group mt-8 inline-flex min-h-12 items-center gap-2 bg-gold-500 px-6 font-semibold text-heritage-950 transition-[background-color,transform] duration-(--duration-base) hover:bg-gold-200 active:scale-[0.97]"
          >
            About the foundation
            <ArrowRight className="size-4 transition-transform duration-(--duration-base) group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
