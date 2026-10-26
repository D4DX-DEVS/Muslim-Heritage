"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

interface Photo {
  url: string;
  alt: string;
}

export function PhotoGallery({ photos }: { photos: Photo[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const go = (delta: number) => setIndex((i) => (i == null ? i : (i + delta + photos.length) % photos.length));
  const current = index != null ? photos[index] : null;

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
        {photos.map((p, i) => (
          <li key={p.url}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="group relative block aspect-[4/3] w-full overflow-hidden rounded-md bg-muted"
              aria-label={`Open photograph ${i + 1} of ${photos.length}`}
            >
              <Image src={p.url} alt={p.alt} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
            </button>
          </li>
        ))}
      </ul>
      <Dialog open={current != null} onOpenChange={(open) => !open && setIndex(null)}>
        <DialogContent
          className="max-w-[calc(100vw-2rem)] gap-3 border-none bg-heritage-950 p-3 text-white sm:max-w-4xl sm:p-4"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") go(1);
            if (e.key === "ArrowLeft") go(-1);
          }}
        >
          <DialogTitle className="sr-only">
            Photograph {index != null ? index + 1 : ""} of {photos.length}
          </DialogTitle>
          <DialogDescription className="sr-only">Use the arrow keys to move between photographs.</DialogDescription>
          {current && (
            // eslint-disable-next-line @next/next/no-img-element -- natural size, unknown aspect
            <img src={current.url} alt={current.alt} className="mx-auto max-h-[75dvh] w-auto max-w-full rounded" />
          )}
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => go(-1)} className="inline-flex size-11 items-center justify-center rounded-full hover:bg-white/10" aria-label="Previous photograph">
              <ChevronLeft className="size-5" />
            </button>
            <span className="text-sm text-white/70" aria-live="polite">
              {index != null ? index + 1 : 0} / {photos.length}
            </span>
            <button type="button" onClick={() => go(1)} className="inline-flex size-11 items-center justify-center rounded-full hover:bg-white/10" aria-label="Next photograph">
              <ChevronRight className="size-5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
