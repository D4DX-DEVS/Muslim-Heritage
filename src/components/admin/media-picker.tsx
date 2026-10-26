"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, ImagePlus, Loader2, Search, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export interface MediaItem {
  id: number;
  url: string;
  filename: string;
  mime: string;
  alt: string;
  width: number | null;
  height: number | null;
}

/** Uploads one file with progress; resolves to the stored item or throws a readable error. */
export function uploadFile(file: File, onProgress: (pct: number) => void): Promise<MediaItem> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/admin/api/media");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText) as { ok: boolean; data?: MediaItem; error?: string };
        if (body.ok && body.data) resolve(body.data);
        else reject(new Error(body.error ?? "Upload failed."));
      } catch {
        reject(new Error("Upload failed."));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

export function UploadButton({ onUploaded, accept = "image/jpeg,image/png,image/webp,image/gif,application/pdf" }: { onUploaded: (m: MediaItem) => void; accept?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  return (
    <>
      <input
        ref={input}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setProgress(0);
          try {
            const item = await uploadFile(file, setProgress);
            toast.success(`Uploaded ${item.filename}`);
            onUploaded(item);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Upload failed.");
          } finally {
            setProgress(null);
          }
        }}
      />
      <Button type="button" variant="outline" disabled={progress != null} onClick={() => input.current?.click()}>
        {progress != null ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
        {progress != null ? `Uploading ${progress}%` : "Upload file"}
      </Button>
      <span className="sr-only" aria-live="polite">
        {progress != null ? `Uploading, ${progress} percent` : ""}
      </span>
    </>
  );
}

interface MediaPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: MediaItem) => void;
  imagesOnly?: boolean;
}

export function MediaPickerDialog({ open, onOpenChange, onSelect, imagesOnly = true }: MediaPickerProps) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [error, setError] = useState<string>();
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);

  const load = useCallback(async (query: string, p: number) => {
    setItems(null);
    setError(undefined);
    try {
      const params = new URLSearchParams({ q: query, page: String(p), pageSize: "20", ...(imagesOnly ? { type: "image" } : {}) });
      const res = await fetch(`/admin/api/media?${params}`, { cache: "no-store" });
      const body = (await res.json()) as { ok: boolean; data: MediaItem[]; meta: { pageCount: number }; error?: string };
      if (!body.ok) throw new Error(body.error);
      setItems(body.data);
      setPageCount(body.meta.pageCount);
    } catch {
      setError("Could not load the media library.");
    }
  }, [imagesOnly]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => load(q, page), q ? 300 : 0);
    return () => clearTimeout(t);
  }, [open, q, page, load]);

  const choose = (m: MediaItem) => {
    onSelect(m);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Choose media</DialogTitle>
          <DialogDescription>Select an existing file or upload a new one.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              aria-label="Search media"
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="pl-9"
              placeholder="Search by filename or alt text"
            />
          </div>
          <UploadButton onUploaded={choose} accept={imagesOnly ? "image/jpeg,image/png,image/webp,image/gif" : undefined} />
        </div>
        {error ? (
          <div role="alert" className="flex flex-col items-center gap-3 py-10 text-sm text-destructive">
            {error}
            <Button type="button" variant="outline" size="sm" onClick={() => load(q, page)}>
              Retry
            </Button>
          </div>
        ) : items == null ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5" role="status" aria-label="Loading media">
            {Array.from({ length: 10 }, (_, i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No media found.</p>
        ) : (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {items.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => choose(m)}
                  className="group relative block aspect-square w-full overflow-hidden rounded-md border border-border bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                  title={m.filename}
                >
                  {m.mime.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element -- thumbnails of arbitrary size
                    <img src={m.url} alt={m.alt || m.filename} className="size-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                  ) : (
                    <span className="flex size-full flex-col items-center justify-center gap-1 p-1 text-xs">
                      <FileText className="size-6" aria-hidden="true" />
                      <span className="line-clamp-2 break-all">{m.filename}</span>
                    </span>
                  )}
                  <span className="sr-only">Select {m.filename}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {pageCount > 1 && (
          <div className="flex items-center justify-between text-sm">
            <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-muted-foreground">
              Page {page} of {pageCount}
            </span>
            <Button type="button" variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Single image field: preview + choose + remove. */
export function MediaField({ value, onChange, label }: { value: MediaItem | null; onChange: (m: MediaItem | null) => void; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {value ? (
        <div className="relative overflow-hidden rounded-md border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element -- preview of arbitrary size */}
          <img src={value.url} alt={value.alt || value.filename} className="max-h-48 w-full object-contain" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 inline-flex size-9 items-center justify-center rounded-full bg-paper/90 shadow hover:bg-paper"
            aria-label={`Remove ${label.toLowerCase()}`}
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}
      <Button type="button" variant="outline" className="w-full" onClick={() => setOpen(true)}>
        <ImagePlus className="size-4" aria-hidden="true" /> {value ? "Change image" : "Choose image"}
      </Button>
      <MediaPickerDialog open={open} onOpenChange={setOpen} onSelect={onChange} />
    </div>
  );
}
