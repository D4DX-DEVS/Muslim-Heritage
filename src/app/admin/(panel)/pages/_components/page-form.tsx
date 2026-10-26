"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { HtmlEditor } from "@/components/admin/html-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { savePageAction } from "../actions";

interface PageFormProps {
  slug: "about" | "contact";
  initial: { title: string; heading: string; bodyHtml: string };
}

export function PageForm({ slug, initial }: PageFormProps) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      noValidate
      className="space-y-4 rounded-lg border border-border bg-card p-4 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!values.title.trim()) {
          setError("Title is required");
          return;
        }
        setError(undefined);
        startTransition(async () => {
          const result = await savePageAction({ slug, data: values });
          if (!result.ok) toast.error(result.error);
          else {
            toast.success(result.message ?? "Saved.");
            router.refresh();
          }
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${slug}-title`}>Title</Label>
          <Input
            id={`${slug}-title`}
            value={values.title}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${slug}-title-error` : undefined}
            onChange={(e) => setValues({ ...values, title: e.target.value })}
          />
          {error && (
            <p id={`${slug}-title-error`} className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${slug}-heading`}>Heading</Label>
          <Input id={`${slug}-heading`} lang="ml" value={values.heading} onChange={(e) => setValues({ ...values, heading: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${slug}-body`}>Content</Label>
        <HtmlEditor id={`${slug}-body`} value={values.bodyHtml} onChange={(bodyHtml) => setValues({ ...values, bodyHtml })} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Save page
        </Button>
        <a href={`/${slug}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-sm font-medium text-heritage-700 hover:underline">
          <ExternalLink className="size-4" aria-hidden="true" /> View /{slug}
        </a>
      </div>
    </form>
  );
}
