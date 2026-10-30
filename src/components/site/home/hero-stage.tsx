"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";

interface HeroStageProps {
  backdrop: ReactNode;
  children: ReactNode;
}

/**
 * The photographs as a clear band across the top with the words beneath them, so nothing is laid over the pictures.
 * As the page scrolls the words drift up and fade.
 */
export function HeroStage({ backdrop, children }: HeroStageProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} aria-labelledby="home-title" className="relative isolate flex flex-col overflow-hidden bg-heritage-950">
      {/* The banners are 13:4 panoramas: shown whole from tablets up, a little taller (sides cropped) on phones. */}
      {/* A strip of the stage colour keeps the photographs clear of the sticky header's lower edge. */}
      <div className="relative mt-4 aspect-[2/1] w-full sm:mt-6 sm:aspect-[13/4] lg:mt-8">
        {backdrop}
      </div>
      <motion.div style={reduce ? undefined : { y: textY, opacity: textOpacity }} className="relative w-full">
        {children}
      </motion.div>
    </section>
  );
}
