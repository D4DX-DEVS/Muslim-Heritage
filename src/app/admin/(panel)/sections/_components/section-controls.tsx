"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { RecordDialog, type FieldDef } from "@/components/admin/record-dialog";
import { Button } from "@/components/ui/button";
import { deleteSectionAction, saveSectionAction } from "../actions";

const FIELDS: FieldDef[] = [
  { name: "title", label: "Title", required: true },
  { name: "description", label: "Description", type: "textarea" },
  { name: "sortOrder", label: "Order", type: "number", hint: "Lower numbers appear first." },
];

interface SectionValues {
  id: number;
  title: string;
  description: string;
  sortOrder: number;
  imageId: number | null;
  articles: number;
}

export function NewSectionButton({ nextOrder }: { nextOrder: number }) {
  return (
    <RecordDialog
      trigger={
        <Button>
          <Plus className="size-4" aria-hidden="true" /> New section
        </Button>
      }
      title="New section"
      fields={FIELDS}
      initial={{ title: "", description: "", sortOrder: String(nextOrder) }}
      submit={(v) => saveSectionAction({ id: null, data: { title: v.title, description: v.description, sortOrder: v.sortOrder, imageId: null } })}
    />
  );
}

export function SectionRowActions({ section }: { section: SectionValues }) {
  return (
    <div className="flex justify-end gap-1">
      <RecordDialog
        trigger={
          <Button variant="ghost" size="icon" aria-label={`Edit ${section.title}`}>
            <Pencil className="size-4" />
          </Button>
        }
        title="Edit section"
        fields={FIELDS}
        initial={{ title: section.title, description: section.description, sortOrder: String(section.sortOrder) }}
        submit={(v) =>
          saveSectionAction({ id: section.id, data: { title: v.title, description: v.description, sortOrder: v.sortOrder, imageId: section.imageId } })
        }
      />
      <ConfirmAction
        trigger={
          <Button variant="ghost" size="icon" aria-label={`Delete ${section.title}`} className="text-destructive">
            <Trash2 className="size-4" />
          </Button>
        }
        title="Delete this section?"
        description={
          section.articles > 0
            ? `${section.articles} article(s) are in this section. Move them first; deletion will be refused.`
            : `“${section.title}” will be removed. Its URL /innerindex/${section.id} will return “not found”.`
        }
        confirmLabel="Delete section"
        destructive
        run={() => deleteSectionAction({ id: section.id })}
      />
    </div>
  );
}
