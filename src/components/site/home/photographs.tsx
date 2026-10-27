import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/site/page-header";
import type { MediaRef } from "@/lib/queries/public";

// Mosaic placement for up to seven photographs on the 4-column desktop grid.
const TILES = [
  "col-span-2 row-span-2",
  "col-span-1 row-span-1",
  "col-span-1 row-span-2",
  "col-span-1 row-span-1",
  "col-span-2 row-span-1",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
];

/** Conference photographs as a mosaic; each settles from a slight zoom as it enters and lifts its caption on hover. */
export function HomePhotographs({ photos, total, first = 1 }: { photos: MediaRef[]; total: number; first?: number }) {
  const shown = photos.slice(0, TILES.length);

  return (
    <section aria-labelledby="photos-heading" className="bg-paper py-16 sm:py-20 lg:py-24">
      <Container>
        <div className="mb-10 grid grid-cols-1 gap-5 lg:mb-12 lg:grid-cols-12 lg:items-end">
          <h2 id="photos-heading" data-reveal="mask" className="font-heading text-[clamp(2.5rem,5vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-heritage-900 lg:col-span-7">
            Three days in Kozhikode
          </h2>
          <div data-reveal style={{ "--i": 1 } as React.CSSProperties} className="lg:col-span-5">
            <p className="max-w-md text-base leading-relaxed text-ink">
              Sessions, speakers and visitors, photographed over the three days.
            </p>
            <Link href="/gallery" className="group mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-heritage-800 hover:text-heritage-600">
              All {total} photographs
              <ArrowRight className="size-4 transition-transform duration-(--duration-base) group-hover:translate-x-1.5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <ul className="grid auto-rows-[9rem] grid-cols-2 gap-2 sm:auto-rows-[12rem] sm:gap-3 lg:auto-rows-[15rem] lg:grid-cols-4">
          {shown.map((m, i) => (
            <li key={m.url} data-reveal style={{ "--i": i % 4, "--rise": "40px" } as React.CSSProperties} className={`mosaic-tile ${TILES[i]} ${i >= 4 ? "max-lg:hidden" : ""}`}>
              <Link href="/gallery" className="group relative block h-full overflow-hidden bg-heritage-100" aria-label={`Photograph ${first + i} of ${total}: open the gallery`}>
                <Image
                  src={m.url}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="mosaic-img object-cover transition-transform duration-[1200ms] ease-(--ease-out) group-hover:scale-[1.06]"
                />
                <span className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-between bg-heritage-950/80 px-4 py-3 text-sm text-white transition-transform duration-400 ease-(--ease-out) group-hover:translate-y-0 group-focus-visible:translate-y-0">
                  <span>Photograph {first + i}</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
