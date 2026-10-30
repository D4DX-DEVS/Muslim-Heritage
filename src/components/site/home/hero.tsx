import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CountUp } from "@/components/site/count-up";
import { Container } from "@/components/site/page-header";
import type { MediaRef } from "@/lib/queries/public";
import { SITE } from "@/lib/site";
import { BannerSlider } from "./banner-slider";
import { HeroStage } from "./hero-stage";

interface HomeHeroProps {
  title: string;
  subtitle: string;
  stats: { articles: number; authors: number; sections: number };
  slides: MediaRef[];
}

const stagger = (i: number) => ({ "--i": i }) as React.CSSProperties;

/**
 * The conference panoramas across the top, kept clear of any text; beneath them the title rises out of a mask,
 * with the dates, the way into the volume and the volume's figures along the foot.
 */
export function HomeHero({ title, subtitle, stats, slides }: HomeHeroProps) {
  const words = title.trim().split(/\s+/);
  const mid = Math.ceil(words.length / 2);
  const lines = [words.slice(0, mid), words.slice(mid)].filter((l) => l.length > 0).map((l) => l.join(" "));
  const figures = [
    { value: stats.articles, label: "Papers online" },
    { value: stats.authors, label: "Authors" },
    { value: stats.sections, label: "Sections" },
    { value: 26, label: "Sessions in three days" },
  ];

  return (
    <HeroStage
      backdrop={
        slides.length > 0 ? <BannerSlider slides={slides} className="h-full" /> : <div className="h-full bg-heritage-900" />
      }
    >
      <Container className="w-full py-8 sm:py-10 lg:py-12">
        <h1 id="home-title" lang="ml" className="font-heading text-[clamp(1.75rem,3.6vw,3.5rem)] font-bold leading-[1.2] tracking-[-0.02em] text-white">
          {lines.map((line, i) => (
            <span key={i} className="line-mask block lg:whitespace-nowrap">
              <span className="line-mask-inner block" style={stagger(i)}>
                {line}
              </span>
            </span>
          ))}
        </h1>

        <div className="mt-5 grid grid-cols-1 gap-6 lg:mt-6 lg:grid-cols-12 lg:items-end lg:gap-12">
          <div className="lg:col-span-7">
            <p lang="ml" className="anim-rise font-heading text-[clamp(1.0625rem,1.5vw,1.375rem)] font-semibold text-gold-200" style={stagger(3)}>
              {subtitle} · 2013 ഡിസംബര്‍ 22–24 · കോഴിക്കോട്
            </p>
            <p className="anim-rise mt-4 max-w-xl text-[1.0625rem] leading-relaxed text-white" style={stagger(4)}>
              The online edition of the conference proceedings, published by the {SITE.name}: research papers on the history, culture
              and public life of Kerala&apos;s Muslims.
            </p>
          </div>
          <div className="flex lg:col-span-5 lg:justify-end">
            <Link
              href="/confindex/1"
              className="anim-rise group inline-flex min-h-13 items-center justify-center gap-2 bg-gold-500 px-7 font-semibold text-heritage-950 transition-[background-color,transform] duration-(--duration-base) hover:bg-gold-200 active:scale-[0.97]"
              style={stagger(5)}
            >
              Browse the proceedings
              <ArrowRight className="size-5 transition-transform duration-(--duration-base) group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/15 pt-6 sm:grid-cols-4 lg:mt-10">
          {figures.map((f, i) => (
            <div key={f.label} className="anim-rise" style={stagger(6 + i)}>
              <dt className="sr-only">{f.label}</dt>
              <dd className="font-heading text-[clamp(1.5rem,2.4vw,2.25rem)] font-bold leading-none text-white">
                <CountUp value={f.value} />
              </dd>
              <dd className="mt-2 text-sm text-white/85">{f.label}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </HeroStage>
  );
}
