"use client";

import { EyeOff, History, Trash2 } from "lucide-react";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { Button } from "@/components/ui/button";
import { deleteArticleAction, restoreRevisionAction, setStatusAction } from "../actions";

interface Revision {
  id: number;
  title: string;
  status: string;
  createdBy: string;
  createdAt: string;
}

function when(iso: string): string {
  return new Date(iso.endsWith("Z") ? iso : `${iso}Z`).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function RevisionList({ articleId, revisions }: { articleId: number; revisions: Revision[] }) {
  return (
    <section className="rounded-lg border border-border bg-card" aria-labelledby="revisions-heading">
      <h2 id="revisions-heading" className="flex items-center gap-2 border-b border-border px-4 py-3 font-heading font-semibold text-heritage-900">
        <History className="size-4 text-gold-600" aria-hidden="true" /> Revision history
      </h2>
      {revisions.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No earlier versions yet. A revision is stored every time the article is saved.</p>
      ) : (
        <ul className="max-h-96 divide-y divide-border overflow-y-auto">
          {revisions.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="line-clamp-1 font-medium">{r.title}</p>
                <p className="text-xs text-muted-foreground">
                  {when(r.createdAt)} · {r.createdBy} · {r.status}
                </p>
              </div>
              <ConfirmAction
                trigger={
                  <Button type="button" variant="outline" size="sm">
                    Restore
                  </Button>
                }
                title="Restore this revision?"
                description="The title, summary and body will be replaced with this version. The current version is saved to history first, so this can be undone."
                confirmLabel="Restore"
                run={() => restoreRevisionAction({ id: articleId, revisionId: r.id })}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ArticleDangerZone({ id, title, status }: { id: number; title: string; status: "draft" | "published" }) {
  return (
    <section className="space-y-4 rounded-lg border border-destructive/30 bg-card p-4" aria-labelledby="danger-heading">
      <h2 id="danger-heading" className="font-heading font-semibold text-heritage-900">
        Visibility & deletion
      </h2>
      {status === "published" && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Unpublishing hides the article from the website immediately.</p>
          <ConfirmAction
            trigger={
              <Button type="button" variant="outline">
                <EyeOff className="size-4" aria-hidden="true" /> Unpublish
              </Button>
            }
            title="Unpublish this article?"
            description={`“${title}” will no longer be visible on the website. You can publish it again at any time.`}
            confirmLabel="Unpublish"
            run={() => setStatusAction({ id, status: "draft" })}
          />
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Deleting removes the article and its revision history permanently.</p>
        <ConfirmAction
          trigger={
            <Button type="button" variant="destructive">
              <Trash2 className="size-4" aria-hidden="true" /> Delete
            </Button>
          }
          title="Delete this article permanently?"
          description={`“${title}” and all of its revisions will be deleted. Its URL /innermore/${id} will return “not found”. This cannot be undone.`}
          confirmLabel="Delete article"
          destructive
          run={() => deleteArticleAction({ id })}
          redirectTo="/admin/articles"
        />
      </div>
    </section>
  );
}
