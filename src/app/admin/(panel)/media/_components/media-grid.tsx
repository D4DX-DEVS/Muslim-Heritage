"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, FileText, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { UploadButton } from "@/components/admin/media-picker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatBytes } from "@/lib/format";
import type { MediaUsage } from "@/lib/queries/admin";
import { deleteMediaAction, mediaUsageAction, saveMediaMetaAction } from "../actions";

export interface MediaRow {
  id: number;
  key: string;
  filename: string;
  mime: string;
  bytes: number;
  width: number | null;
  height: number | null;
  alt: string;
  caption: string;
  attribution: string;
  legacyUrl: string | null;
}

export function UploadToLibrary() {
  const router = useRouter();
  return <UploadButton onUploaded={() => router.refresh()} />;
}

export function MediaGrid({ items }: { items: MediaRow[] }) {
  const [selected, setSelected] = useState<MediaRow | null>(null);
  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {items.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => setSelected(m)}
              className="group block w-full overflow-hidden rounded-lg border border-border bg-card text-left hover:border-gold-500 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="block aspect-square overflow-hidden bg-muted">
                {m.mime.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element -- library thumbnails of arbitrary size
                  <img src={`/${m.key}`} alt={m.alt || ""} loading="lazy" className="size-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <span className="flex size-full items-center justify-center">
                    <FileText className="size-10 text-muted-foreground" aria-hidden="true" />
                  </span>
                )}
              </span>
              <span className="block p-2">
                <span className="block truncate text-xs font-medium">{m.filename}</span>
                <span className="block text-[0.7rem] text-muted-foreground">
                  {formatBytes(m.bytes)}
                  {m.width ? ` · ${m.width}×${m.height}` : ""}
                  {!m.alt && m.mime.startsWith("image/") ? " · no alt text" : ""}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {selected && <MediaDetails key={selected.id} item={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function MediaDetails({ item, onClose }: { item: MediaRow; onClose: () => void }) {
  const router = useRouter();
  const [meta, setMeta] = useState({ alt: item.alt, caption: item.caption, attribution: item.attribution });
  const [usage, setUsage] = useState<MediaUsage[] | null>(null);
  const [usageError, setUsageError] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let live = true;
    mediaUsageAction({ id: item.id })
      .then((r) => {
        if (!live) return;
        if (r.ok) setUsage(r.data ?? []);
        else setUsageError(true);
      })
      .catch(() => live && setUsageError(true));
    return () => {
      live = false;
    };
  }, [item.id]);

  const url = `/${item.key}`;
  return (
    <Dialog open onOpenChange={(o) => !o && !pending && onClose()}>
      <DialogContent className="max-h-[92dvh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="break-all">{item.filename}</DialogTitle>
          <DialogDescription>
            {item.mime} · {formatBytes(item.bytes)}
            {item.width ? ` · ${item.width}×${item.height}px` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
          <div className="space-y-3">
            {item.mime.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element -- preview at natural size
              <img src={url} alt={item.alt} className="max-h-72 w-full rounded-md bg-muted object-contain" />
            ) : (
              <a href={url} target="_blank" rel="noopener" className="flex h-40 items-center justify-center rounded-md bg-muted text-sm underline">
                Open document
              </a>
            )}
            <div className="flex gap-2">
              <Input readOnly value={url} aria-label="File URL" className="font-mono text-xs" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Copy file URL"
                onClick={() => navigator.clipboard.writeText(url).then(() => toast.success("URL copied"))}
              >
                <Copy className="size-4" />
              </Button>
            </div>
            {item.legacyUrl && <p className="break-all text-xs text-muted-foreground">Migrated from {item.legacyUrl}</p>}
          </div>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(async () => {
                const r = await saveMediaMetaAction({ id: item.id, data: meta });
                if (!r.ok) toast.error(r.error);
                else {
                  toast.success(r.message ?? "Saved.");
                  router.refresh();
                }
              });
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="media-alt">Alt text</Label>
              <Input id="media-alt" lang="ml" value={meta.alt} maxLength={300} onChange={(e) => setMeta({ ...meta, alt: e.target.value })} />
              <p className="text-xs text-muted-foreground">Describe the image for people who can’t see it.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="media-caption">Caption</Label>
              <Textarea id="media-caption" lang="ml" rows={2} value={meta.caption} maxLength={500} onChange={(e) => setMeta({ ...meta, caption: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="media-attribution">Attribution / credit</Label>
              <Input id="media-attribution" value={meta.attribution} maxLength={300} onChange={(e) => setMeta({ ...meta, attribution: e.target.value })} />
            </div>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Save details
            </Button>
          </form>
        </div>
        <section className="space-y-2 border-t border-border pt-4" aria-labelledby="usage-heading">
          <h3 id="usage-heading" className="text-sm font-semibold">
            Where this file is used
          </h3>
          {usageError ? (
            <p className="text-sm text-destructive">Could not check usage.</p>
          ) : usage == null ? (
            <div className="space-y-2" role="status" aria-label="Checking usage">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : usage.length === 0 ? (
            <p className="text-sm text-muted-foreground">Not used anywhere. It can be deleted safely.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {usage.map((u, i) => (
                <li key={`${u.href}-${i}`}>
                  <Link href={u.href} className="text-heritage-700 hover:underline">
                    {u.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <ConfirmAction
            trigger={
              <Button type="button" variant="destructive" size="sm" disabled={usage == null || usage.length > 0}>
                <Trash2 className="size-4" aria-hidden="true" /> Delete file
              </Button>
            }
            title="Delete this file permanently?"
            description="The file is removed from storage and its URL will stop working. This cannot be undone."
            confirmLabel="Delete file"
            destructive
            run={async () => {
              const r = await deleteMediaAction({ id: item.id });
              if (r.ok) onClose();
              return r;
            }}
          />
          {usage && usage.length > 0 && <p className="text-xs text-muted-foreground">Deletion is disabled while the file is in use.</p>}
        </section>
      </DialogContent>
    </Dialog>
  );
}
