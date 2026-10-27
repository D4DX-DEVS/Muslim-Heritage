"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Pins a section once its foot reaches the bottom of the screen, so the next section slides up over it
 * like a sheet laid on top; the covered section dims as it disappears.
 */
export function StackSection({ children, depth }: { children: ReactNode; depth: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [top, setTop] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["end end", "end start"] });
  const shade = useTransform(scrollYProgress, [0, 1], [0, 0.55]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Pin just under the sticky header when the section fits the screen, else when its foot reaches the bottom.
    const measure = () => {
      const header = document.querySelector("header")?.offsetHeight ?? 0;
      setTop(Math.min(header, window.innerHeight - el.offsetHeight));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div ref={ref} className="sticky" style={{ top, zIndex: depth }}>
      <div className="relative">
        {children}
        {!reduce && <motion.div aria-hidden="true" style={{ opacity: shade }} className="pointer-events-none absolute inset-0 bg-heritage-950" />}
      </div>
    </div>
  );
}
