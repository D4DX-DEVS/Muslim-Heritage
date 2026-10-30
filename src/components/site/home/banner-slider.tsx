"use client";

import Image from "next/image";
import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import type { MediaRef } from "@/lib/queries/public";

const INTERVAL_MS = 5500;

/** Panoramic conference photographs, cross-fading with a slow zoom; pauses on hover and for reduced motion. */
export function BannerSlider({ slides, className = "aspect-video sm:aspect-[13/4]" }: { slides: MediaRef[]; className?: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (paused || reduce || slides.length < 2) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused, reduce, slides.length]);

  return (
    <div
      className={`relative overflow-hidden bg-heritage-950 ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <Image
          key={s.url}
          src={s.url}
          alt={i === index ? "Kerala Muslim History Conference, Kozhikode, December 2013" : ""}
          aria-hidden={i !== index}
          fill
          priority={i === 0}
          sizes="100vw"
          className={`object-cover transition-[opacity,transform] duration-[1400ms,7000ms] ease-out ${
            i === index ? "scale-[1.02] opacity-100" : "scale-100 opacity-0"
          }`}
        />
      ))}

      {slides.length > 1 && (
        <div className="absolute right-0 top-0 z-10 flex gap-1.5 px-4 py-4 sm:px-6 lg:px-8">
          {slides.map((s, i) => (
            <button
              key={s.url}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show photograph ${i + 1} of ${slides.length}`}
              aria-current={i === index}
              className="group/dot flex h-6 items-center"
            >
              <span
                className={`block h-1 w-6 origin-left bg-white transition-[opacity,transform] duration-300 ${
                  i === index ? "opacity-100" : "scale-x-50 opacity-50 group-hover/dot:scale-x-100 group-hover/dot:opacity-80"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
