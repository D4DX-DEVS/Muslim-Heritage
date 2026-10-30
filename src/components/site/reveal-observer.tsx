"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __revealBooted?: boolean;
  }
}

const SELECTOR = "[data-reveal]:not([data-shown])";

/**
 * Marks each [data-reveal] element as shown the first time it scrolls into view (styles in globals.css).
 * A [data-reveal="mask"] element starts fully clipped, which the observer counts as invisible,
 * so its parent is watched in its place.
 *
 * Content can arrive after a navigation has already committed (a page streams in behind its loading.tsx),
 * so new elements are picked up from DOM mutations rather than once per pathname.
 */
export function RevealObserver() {
  useEffect(() => {
    window.__revealBooted = true;
    document.documentElement.classList.add("reveal-ready");

    const watched = new Map<Element, Element[]>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          for (const el of watched.get(entry.target) ?? []) el.setAttribute("data-shown", "");
          watched.delete(entry.target);
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.1 },
    );

    const watch = (el: Element) => {
      const target = el.getAttribute("data-reveal") === "mask" && el.parentElement ? el.parentElement : el;
      const els = watched.get(target);
      if (els?.includes(el)) return;
      watched.set(target, [...(els ?? []), el]);
      io.observe(target);
    };

    let frame = 0;
    const scan = () => {
      frame = 0;
      // Forget targets React has removed, so they can be collected.
      for (const target of watched.keys()) {
        if (!target.isConnected) {
          io.unobserve(target);
          watched.delete(target);
        }
      }
      document.querySelectorAll(SELECTOR).forEach(watch);
    };
    scan();

    const mo = new MutationObserver(() => {
      if (!frame) frame = requestAnimationFrame(scan);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
