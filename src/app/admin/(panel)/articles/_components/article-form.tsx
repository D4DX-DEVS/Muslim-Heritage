"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CloudOff, ExternalLink, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { AuthorPicker } from "@/components/admin/author-picker";
import { HtmlEditor } from "@/components/admin/html-editor";
import { MediaField, type MediaItem } from "@/components/admin/media-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { saveArticleAction } from "../actions";

const formSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(300),
  summary: z.string().max(600, "Keep the summary under 600 characters"),
  bodyHtml: z.string().min(1, "The article body is empty").max(400_000),
  sectionId: z.string(),
  authorIds: z.array(z.number()),
  leadImage: z.custom<MediaItem | null>(),
  featuredOrder: z.string().regex(/^\d{0,2}$/, "Use a number from 1 to 99, or leave empty"),
  seoTitle: z.string().max(160, "160 characters maximum"),
  seoDescription: z.string().max(300, "300 characters maximum"),
});
export type ArticleFormValues = z.infer<typeof formSchema>;

interface ArticleFormProps {
  id: number | null;
  status: "draft" | "published";
  initial: ArticleFormValues;
  sections: { id: number; title: string }[];
  authors: { id: number; name: string }[];
}

interface LocalDraft {
  savedAt: number;
  values: ArticleFormValues;
}

function subscribeStorage(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}

export function ArticleForm({ id, status, initial, sections, authors }: ArticleFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState<"draft" | "published" | null>(null);
  const storageKey = `mh-article-draft:${id ?? "new"}`;
  const [dismissed, setDismissed] = useState(false);
  const storedDraft = useSyncExternalStore(subscribeStorage, () => readStorage(storageKey), () => null);
  // A local copy left by a crash/refresh that differs from what the server has.
  const restorable = useMemo<LocalDraft | null>(() => {
    if (dismissed || !storedDraft) return null;
    try {
      const draft = JSON.parse(storedDraft) as LocalDraft;
      return JSON.stringify(draft.values) !== JSON.stringify(initial) ? draft : null;
    } catch {
      return null;
    }
  }, [storedDraft, dismissed, initial]);
  const form = useForm<ArticleFormValues>({ resolver: zodResolver(formSchema), defaultValues: initial });
  const { errors, isDirty } = form.formState;
  const values = useWatch({ control: form.control });
  const skipFirst = useRef(true);

  // Local autosave while typing.
  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    if (!isDirty) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ savedAt: Date.now(), values: form.getValues() }));
      } catch {
        // Quota or privacy mode — ignore.
      }
    }, 800);
    return () => clearTimeout(t);
  }, [values, isDirty, storageKey, form]);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const submit = (target: "draft" | "published") =>
    form.handleSubmit((v) => {
      setSubmitting(target);
      startTransition(async () => {
        const result = await saveArticleAction({
          id,
          data: {
            title: v.title,
            summary: v.summary,
            bodyHtml: v.bodyHtml,
            sectionId: v.sectionId === "none" ? null : v.sectionId,
            authorIds: v.authorIds,
            leadImageId: v.leadImage?.id ?? null,
            featuredOrder: v.featuredOrder || null,
            seoTitle: v.seoTitle,
            seoDescription: v.seoDescription,
            status: target,
          },
        });
        setSubmitting(null);
        if (!result.ok) {
          toast.error(result.error);
          for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
            const name = field.replace(/^data\./, "") as keyof ArticleFormValues;
            if (name in initial) form.setError(name, { message });
          }
          return;
        }
        try {
          localStorage.removeItem(storageKey);
        } catch {}
        form.reset(v);
        toast.success(result.message ?? "Saved.");
        if (id == null && result.data) router.replace(`/admin/articles/${result.data.id}`);
        else router.refresh();
      });
    })();

  const field = (name: keyof ArticleFormValues) => ({
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });
  return (
    <form onSubmit={(e) => e.preventDefault()} noValidate className="grid gap-6 xl:grid-cols-[1fr_20rem]">
      <div className="min-w-0 space-y-5">
        {restorable && (
          <div role="status" className="flex flex-col gap-3 rounded-lg border border-gold-500/40 bg-gold-200/40 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2">
              <CloudOff className="size-4 shrink-0 text-gold-700" aria-hidden="true" />
              Unsaved changes from {new Date(restorable.savedAt).toLocaleString()} were found on this device.
            </span>
            <span className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  form.reset(restorable.values, { keepDefaultValues: true });
                  setDismissed(true);
                }}
              >
                <RotateCcw className="size-4" aria-hidden="true" /> Restore
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  try {
                    localStorage.removeItem(storageKey);
                  } catch {}
                  setDismissed(true);
                }}
              >
                Discard
              </Button>
            </span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" lang="ml" className="h-11 text-base" {...form.register("title")} {...field("title")} />
          <FieldError id="title-error" message={errors.title?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bodyHtml">Article body</Label>
          <Controller
            control={form.control}
            name="bodyHtml"
            render={({ field: f }) => <HtmlEditor id="bodyHtml" value={f.value} onChange={f.onChange} invalid={Boolean(errors.bodyHtml)} describedBy={errors.bodyHtml ? "bodyHtml-error" : undefined} />}
          />
          <FieldError id="bodyHtml-error" message={errors.bodyHtml?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="summary">Summary</Label>
          <Textarea id="summary" lang="ml" rows={3} {...form.register("summary")} {...field("summary")} />
          <p className="text-xs text-muted-foreground">Shown on cards and in search results. Left empty, it is generated from the opening text.</p>
          <FieldError id="summary-error" message={errors.summary?.message} />
        </div>

        <fieldset className="space-y-4 rounded-lg border border-border bg-card p-4 sm:p-6">
          <legend className="px-1 text-sm font-semibold">Search engine settings</legend>
          <div className="space-y-1.5">
            <Label htmlFor="seoTitle">SEO title</Label>
            <Input id="seoTitle" {...form.register("seoTitle")} {...field("seoTitle")} />
            <FieldError id="seoTitle-error" message={errors.seoTitle?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seoDescription">SEO description</Label>
            <Textarea id="seoDescription" rows={2} {...form.register("seoDescription")} {...field("seoDescription")} />
            <FieldError id="seoDescription-error" message={errors.seoDescription?.message} />
          </div>
        </fieldset>
      </div>

      <aside className="space-y-5 xl:sticky xl:top-20 xl:self-start">
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <p className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium">{status === "published" ? "Published" : "Draft"}</span>
          </p>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {isDirty ? "Unsaved changes (kept on this device until saved)" : "All changes saved"}
          </p>
          <div className="grid gap-2">
            <Button type="button" onClick={() => submit("published")} disabled={pending}>
              {submitting === "published" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {status === "published" ? "Update" : "Publish"}
            </Button>
            {status === "draft" && (
              <Button type="button" variant="outline" onClick={() => submit("draft")} disabled={pending}>
                {submitting === "draft" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Save draft
              </Button>
            )}
            {id != null && (
              <a
                href={`/innermore/${id}${status === "draft" ? "?preview=1" : ""}`}
                target="_blank"
                rel="noopener"
                className="inline-flex min-h-9 items-center justify-center gap-2 text-sm font-medium text-heritage-700 hover:underline"
              >
                <ExternalLink className="size-4" aria-hidden="true" /> {status === "draft" ? "Preview draft" : "View on site"}
              </a>
            )}
          </div>
        </div>

        <div className="space-y-1.5 rounded-lg border border-border bg-card p-4">
          <Label htmlFor="sectionId">Section</Label>
          <Controller
            control={form.control}
            name="sectionId"
            render={({ field: f }) => (
              <Select value={f.value} onValueChange={f.onChange}>
                <SelectTrigger id="sectionId" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No section</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <div className="space-y-1.5 pt-3">
            <Label htmlFor="featuredOrder">Introduction order</Label>
            <Input id="featuredOrder" inputMode="numeric" placeholder="Not featured" {...form.register("featuredOrder")} {...field("featuredOrder")} />
            <p className="text-xs text-muted-foreground">Set a number to list this article among the introductions (ആമുഖം) on the homepage.</p>
            <FieldError id="featuredOrder-error" message={errors.featuredOrder?.message} />
          </div>
        </div>

        <div className="space-y-1.5 rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium">Authors</p>
          <Controller control={form.control} name="authorIds" render={({ field: f }) => <AuthorPicker options={authors} value={f.value} onChange={f.onChange} />} />
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <Controller control={form.control} name="leadImage" render={({ field: f }) => <MediaField label="Featured image" value={f.value} onChange={f.onChange} />} />
        </div>
      </aside>
    </form>
  );
}
