"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { MediaField, type MediaItem } from "@/components/admin/media-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteAuthorAction, saveAuthorAction } from "../actions";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  designation: z.string().max(300),
  bio: z.string().max(5000, "Keep the biography under 5000 characters"),
  photo: z.custom<MediaItem | null>(),
});
type Values = z.infer<typeof schema>;

export function AuthorForm({ id, initial, papers }: { id: number | null; initial: Values; papers: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: initial });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((v) =>
    startTransition(async () => {
      const result = await saveAuthorAction({ id, data: { name: v.name, designation: v.designation, bio: v.bio, photoId: v.photo?.id ?? null } });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Saved.");
      form.reset(v);
      if (id == null && result.data) router.replace(`/admin/authors/${result.data.id}`);
      else router.refresh();
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="grid max-w-4xl gap-6 md:grid-cols-[1fr_16rem]">
      <div className="space-y-4 rounded-lg border border-border bg-card p-4 sm:p-6">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" lang="ml" aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? "name-error" : undefined} {...form.register("name")} />
          {errors.name && (
            <p id="name-error" className="text-sm text-destructive">
              {errors.name.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="designation">Designation</Label>
          <Input id="designation" lang="ml" {...form.register("designation")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bio">Biography</Label>
          <Textarea id="bio" lang="ml" rows={6} aria-invalid={errors.bio ? true : undefined} {...form.register("bio")} />
          {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Save author
          </Button>
          {id != null && (
            <ConfirmAction
              trigger={
                <Button type="button" variant="ghost" className="text-destructive">
                  <Trash2 className="size-4" aria-hidden="true" /> Delete
                </Button>
              }
              title="Delete this author?"
              description={
                papers > 0
                  ? `This author is credited on ${papers} article(s) and cannot be deleted until those credits are removed.`
                  : "The author profile will be removed permanently."
              }
              confirmLabel="Delete author"
              destructive
              run={() => deleteAuthorAction({ id })}
              redirectTo="/admin/authors"
            />
          )}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <Controller control={form.control} name="photo" render={({ field }) => <MediaField label="Portrait" value={field.value} onChange={field.onChange} />} />
      </div>
    </form>
  );
}
