"use client";

import { Check } from "lucide-react";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { Button } from "@/components/ui/button";
import { resolveIssueAction } from "./actions";

export function IssueResolveButton({ id }: { id: number }) {
  return (
    <ConfirmAction
      trigger={
        <Button variant="outline" size="sm">
          <Check className="size-4" aria-hidden="true" /> Mark resolved
        </Button>
      }
      title="Mark this issue as resolved?"
      description="Use this once the item has been checked or fixed manually. Re-running the import recreates open issues."
      confirmLabel="Mark resolved"
      run={() => resolveIssueAction({ id })}
    />
  );
}
