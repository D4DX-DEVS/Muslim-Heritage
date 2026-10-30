import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Container } from "@/components/site/page-header";
import type { ArticleCard } from "@/lib/queries/public";

const stagger = (i: number) => ({ "--i": i }) as React.CSSProperties;

// Card grounds, rotated so each card that slides up differs from the one it covers.
const CARDS = ["bg-ivory", "bg-heritage-100", "bg-gold-200"];

/**
 * The papers that open the volume as cards, each with the paper's lead photograph, that pin under the header and
 * stack, each sliding up over the last as the page scrolls; a card fills with colour from the left on hover.
 */
export function HomeReading({ papers }: { papers: ArticleCard[] }) {
  return (
    <section aria-labelledby="reading-heading" className="bg-paper py-16 sm:py-20 lg:py-24">
      <Container className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <h2 id="reading-heading" data-reveal="mask" className="font-heading text-[clamp(1.75rem,3vw,2.75rem)] font-bold leading-[1.1] tracking-[-0.03em] text-heritage-900">
              Where to begin
            </h2>
            <p data-reveal style={stagger(1)} className="mt-5 max-w-sm text-base leading-relaxed text-ink">
              The papers that open the volume. The rest follow section by section in the contents below.
            </p>
            <Link
              href="/articles"
              data-reveal
              style={stagger(2)}
              className="group mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-heritage-800 hover:text-heritage-600"
            >
              All articles
              <ArrowRight className="size-4 transition-transform duration-(--duration-base) group-hover:translate-x-1.5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <ul className="space-y-3 lg:col-span-8 lg:space-y-6">
          {papers.map((a, i) => (
            <li key={a.id} data-reveal style={{ ...stagger(i % 3), "--stack": `calc(6rem + ${i} * 0.875rem)` } as React.CSSProperties} className={`lg:sticky lg:top-(--stack) ${i >= 3 ? "max-lg:hidden" : ""}`}>
              <Link
                href={`/innermore/${a.id}`}
                className={`group relative flex min-h-[11rem] overflow-hidden lg:min-h-[16rem] ${CARDS[i % CARDS.length]}`}
              >
                <span aria-hidden="true" className="absolute inset-0 bg-heritage-900 [clip-path:inset(0_100%_0_0)] transition-[clip-path] duration-500 ease-(--ease-out) group-hover:[clip-path:inset(0)] group-focus-visible:[clip-path:inset(0)]" />
                {a.image && (
                  <span className="relative hidden w-44 shrink-0 overflow-hidden bg-heritage-100 sm:block lg:w-60">
                    <Image
                      src={a.image.url}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 15rem, 11rem"
                      className="object-cover transition-transform duration-500 ease-(--ease-out) group-hover:scale-[1.04]"
                    />
                  </span>
                )}
                <span className="relative flex flex-1 items-center gap-6 px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
                  <span className="min-w-0 flex-1">
                    {a.section && (
                      <span lang="ml" className="block text-sm text-gold-700 transition-colors duration-300 group-hover:text-gold-200">
                        {a.section.title}
                      </span>
                    )}
                    <h3
                      lang="ml"
                      className="mt-1.5 font-heading text-[clamp(1.125rem,1.7vw,1.5rem)] font-semibold leading-snug text-heritage-900 transition-[color,transform] duration-500 ease-(--ease-out) group-hover:translate-x-2 group-hover:text-white"
                    >
                      {a.title}
                    </h3>
                    <span className="mt-2 block text-sm text-ink-soft transition-colors duration-300 group-hover:text-white/80">
                      <span lang="ml">{a.authors.map((x) => x.name).join(", ") || "Kerala Muslim History Conference"}</span>
                    </span>
                  </span>
                  <span className="inline-flex size-12 shrink-0 items-center justify-center bg-paper text-heritage-900 transition-[background-color,color,transform] duration-500 ease-(--ease-out) group-hover:rotate-45 group-hover:bg-gold-500 group-hover:text-heritage-950">
                    <ArrowUpRight className="size-5" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
