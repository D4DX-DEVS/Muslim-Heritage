"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { RecordDialog, type FieldDef } from "@/components/admin/record-dialog";
import { Button } from "@/components/ui/button";
import { deleteBoardMemberAction, saveBoardMemberAction } from "../actions";

const FIELDS: FieldDef[] = [
  {
    name: "board",
    label: "Board",
    type: "select",
    options: [
      { value: "director", label: "Director Board" },
      { value: "advisory", label: "Advisory Board" },
    ],
  },
  { name: "name", label: "Name", required: true },
  { name: "role", label: "Role", required: true, hint: "Use “Member” for ordinary members; other roles are highlighted (e.g. Director, Chief Patron)." },
  { name: "sortOrder", label: "Order", type: "number" },
];

interface Member {
  id: number;
  board: "director" | "advisory";
  role: string;
  name: string;
  sortOrder: number;
}

const toData = (v: Record<string, string>) => ({ board: v.board, name: v.name, role: v.role, sortOrder: v.sortOrder });

export function NewMemberButton({ board, nextOrder }: { board: "director" | "advisory"; nextOrder: number }) {
  return (
    <RecordDialog
      trigger={
        <Button variant="outline" size="sm">
          <Plus className="size-4" aria-hidden="true" /> Add member
        </Button>
      }
      title="Add board member"
      fields={FIELDS}
      initial={{ board, name: "", role: "Member", sortOrder: String(nextOrder) }}
      submit={(v) => saveBoardMemberAction({ id: null, data: toData(v) })}
    />
  );
}

export function MemberActions({ member }: { member: Member }) {
  return (
    <div className="flex shrink-0 gap-1">
      <RecordDialog
        trigger={
          <Button variant="ghost" size="icon" aria-label={`Edit ${member.name}`}>
            <Pencil className="size-4" />
          </Button>
        }
        title="Edit board member"
        fields={FIELDS}
        initial={{ board: member.board, name: member.name, role: member.role, sortOrder: String(member.sortOrder) }}
        submit={(v) => saveBoardMemberAction({ id: member.id, data: toData(v) })}
      />
      <ConfirmAction
        trigger={
          <Button variant="ghost" size="icon" className="text-destructive" aria-label={`Remove ${member.name}`}>
            <Trash2 className="size-4" />
          </Button>
        }
        title="Remove board member?"
        description={`${member.name} will be removed from the ${member.board === "director" ? "Director" : "Advisory"} Board page.`}
        confirmLabel="Remove"
        destructive
        run={() => deleteBoardMemberAction({ id: member.id })}
      />
    </div>
  );
}
