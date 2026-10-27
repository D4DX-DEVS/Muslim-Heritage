"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";

interface HeroStageProps {
  backdrop: ReactNode;
  children: ReactNode;
}

/**
 * A first screen with the photographs behind it (above it on phones). As the page scrolls the photographs sink and
 * zoom slowly while the words drift up and fade, so the next section slides over a moving picture.
 */
export function HeroStage({ backdrop, children }: HeroStageProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const photoY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const photoScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={ref}
      aria-labelledby="home-title"
      className="relative isolate flex flex-col overflow-hidden bg-heritage-950 lg:min-h-[calc(100svh-4.5rem)] lg:justify-end"
    >
      {/* Phones and tablets: the panorama is its own band above the words, so it isn't cropped to a sliver.
          Desktop: it fills the whole first screen behind them. */}
      <motion.div
        style={reduce ? undefined : { y: photoY, scale: photoScale }}
        className="relative aspect-[16/10] w-full origin-top sm:aspect-[16/8] lg:absolute lg:inset-0 lg:-z-10 lg:aspect-auto"
      >
        {backdrop}
      </motion.div>
      <div aria-hidden="true" className="absolute inset-0 -z-10 hidden bg-gradient-to-t from-heritage-950 via-heritage-950/75 to-heritage-950/45 lg:block" />
      <motion.div style={reduce ? undefined : { y: textY, opacity: textOpacity }} className="relative w-full bg-heritage-950 lg:bg-transparent">
        {children}
      </motion.div>
    </section>
  );
}
