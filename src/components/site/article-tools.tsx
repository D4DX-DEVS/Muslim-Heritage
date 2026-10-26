"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import { Check, Link2, MessageCircle, Printer, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const reduce = useReducedMotion();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 40, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden="true"
      className="no-print fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-gold-500"
      style={{ scaleX: reduce ? scrollYProgress : scaleX }}
    />
  );
}

const btn =
  "inline-flex size-11 items-center justify-center rounded-full border border-border bg-paper text-heritage-800 transition-colors hover:border-gold-500 hover:text-gold-700";

export function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const enc = encodeURIComponent;
  return (
    <div className="no-print flex flex-wrap items-center gap-2" aria-label="Share this article" role="group">
      <a className={btn} href={`https://wa.me/?text=${enc(`${title} ${url}`)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp">
        <MessageCircle className="size-4" />
      </a>
      <a className={btn} href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook">
        <Share2 className="size-4" />
      </a>
      <button
        type="button"
        className={cn(btn, copied && "border-heritage-600 text-heritage-600")}
        aria-label={copied ? "Link copied" : "Copy link"}
        onClick={() => navigator.clipboard?.writeText(url).then(() => setCopied(true))}
      >
        {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
      </button>
      <button type="button" className={btn} aria-label="Print article" onClick={() => window.print()}>
        <Printer className="size-4" />
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Link copied to clipboard" : ""}
      </span>
    </div>
  );
}
