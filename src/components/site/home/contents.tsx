"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useState } from "react";
import { Container } from "@/components/site/page-header";
import type { ContentsSection } from "@/lib/queries/public";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The volume's contents: every section as a chip in one block, the chosen one's papers opening
 * below in a full-width panel, two columns, each paper rising in after the last.
 */
export function HomeContents({ sections }: { sections: ContentsSection[] }) {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const uid = useId();
  const current = sections[active];

  const select = (next: number) => {
    setActive(next);
    document.getElementById(`${uid}-tab-${next}`)?.focus();
  };

  return (
    <section aria-labelledby="contents-heading" className="bg-ivory py-16 sm:py-20 lg:py-24">
      <Container>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-end">
          <h2
            id="contents-heading"
            lang="ml"
            data-reveal="mask"
            className="font-heading text-[clamp(3rem,8vw,7.5rem)] font-bold leading-[1.05] tracking-[-0.03em] text-heritage-900 lg:col-span-7"
          >
            ഉള്ളടക്കം
          </h2>
          <p data-reveal style={{ "--i": 1 } as React.CSSProperties} className="max-w-md text-base leading-relaxed text-ink lg:col-span-5">
            Every section of the volume in printed order. Choose one to see its papers.
          </p>
        </div>

        <div role="tablist" aria-label="Sections" data-reveal style={{ "--i": 2 } as React.CSSProperties} className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:mt-10 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 lg:mt-12">
          {sections.map((s, i) => {
            const selected = i === active;
            return (
              <button
                key={s.id}
                id={`${uid}-tab-${i}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls={`${uid}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={(e) => {
                  const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
                  if (!step) return;
                  e.preventDefault();
                  select((i + step + sections.length) % sections.length);
                }}
                className={`group/chip relative inline-flex min-h-11 shrink-0 items-center gap-2.5 px-4 py-2 text-left transition-[color,background-color,transform] duration-(--duration-base) active:scale-[0.97] ${
                  selected ? "text-white" : "bg-secondary text-heritage-900 hover:-translate-y-0.5 hover:bg-accent"
                }`}
              >
                {selected && (
                  <motion.span
                    layoutId={reduce ? undefined : `${uid}-chip`}
                    transition={{ duration: 0.45, ease: EASE }}
                    aria-hidden="true"
                    className="absolute inset-0 bg-heritage-900"
                  />
                )}
                <span lang="ml" className="relative whitespace-nowrap font-heading text-[0.9375rem] font-semibold leading-snug sm:whitespace-normal">
                  {s.title}
                </span>
                <span className={`relative text-sm tabular-nums ${selected ? "text-gold-200" : "text-ink-soft"}`}>{s.articles.length}</span>
              </button>
            );
          })}
        </div>

        <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${active}`} className="mt-6 bg-heritage-900 text-white">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.id}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.32, ease: EASE }}
              className="p-6 sm:p-10 lg:p-14"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <h3 lang="ml" className="font-heading text-[clamp(1.5rem,2.6vw,2.25rem)] font-semibold leading-snug">
                  {current.title}
                </h3>
                <Link
                  href={`/innerindex/${current.id}`}
                  className="group/open inline-flex min-h-12 shrink-0 items-center gap-2 self-start bg-gold-500 px-5 font-semibold text-heritage-950 transition-[background-color,transform] duration-(--duration-base) hover:bg-gold-200 active:scale-[0.97] sm:self-auto"
                >
                  Open the section
                  <ArrowRight className="size-4 transition-transform duration-(--duration-base) group-hover/open:translate-x-1" aria-hidden="true" />
                </Link>
              </div>

              <ul className="mt-8 grid grid-cols-1 gap-2 md:grid-cols-2 lg:mt-10">
                {current.articles.map((a, i) => (
                  <motion.li
                    key={a.id}
                    initial={reduce ? false : { opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: EASE, delay: Math.min(i, 12) * 0.045 + 0.1 }}
                    className={i >= 4 ? "max-md:hidden" : undefined}
                  >
                    <Link
                      href={`/innermore/${a.id}`}
                      className="group/paper flex h-full items-start gap-4 bg-heritage-800 p-5 transition-[background-color,transform] duration-300 ease-(--ease-out) hover:-translate-y-0.5 hover:bg-heritage-700"
                    >
                      <span className="min-w-0 flex-1">
                        <span lang="ml" className="block text-base font-medium leading-snug text-white">
                          {a.title}
                        </span>
                        {a.authors && (
                          <span lang="ml" className="mt-1.5 block text-sm text-white/75">
                            {a.authors}
                          </span>
                        )}
                      </span>
                      <ArrowUpRight
                        className="mt-0.5 size-5 shrink-0 text-gold-500 transition-transform duration-300 ease-(--ease-out) group-hover/paper:-translate-y-0.5 group-hover/paper:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>
      </Container>
    </section>
  );
}
