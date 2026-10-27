"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

declare global {
  interface Window {
    __revealBooted?: boolean;
  }
}

/**
 * Marks each [data-reveal] element as shown the first time it scrolls into view (styles in globals.css).
 * A [data-reveal="mask"] element starts fully clipped, which the observer counts as invisible,
 * so its parent is watched in its place.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    window.__revealBooted = true;
    document.documentElement.classList.add("reveal-ready");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          for (const el of watched.get(entry.target) ?? []) el.setAttribute("data-shown", "");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.1 },
    );
    const watched = new Map<Element, Element[]>();
    document.querySelectorAll("[data-reveal]:not([data-shown])").forEach((el) => {
      const target = el.getAttribute("data-reveal") === "mask" && el.parentElement ? el.parentElement : el;
      watched.set(target, [...(watched.get(target) ?? []), el]);
      observer.observe(target);
    });
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
