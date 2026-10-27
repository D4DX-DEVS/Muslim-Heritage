"use client";

import { motion, useScroll, useSpring } from "motion/react";

/** A gold line along the foot of the header that grows with how far the page has been read. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 32, restDelta: 0.001 });

  return <motion.div aria-hidden="true" style={{ scaleX }} className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-gold-500" />;
}
