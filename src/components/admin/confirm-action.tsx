"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ActionResultLike {
  ok: boolean;
  error?: string;
  message?: string;
}

interface ConfirmActionProps {
  trigger: ReactNode;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  run: () => Promise<ActionResultLike>;
  /** Where to go after success; refreshes the current page when omitted. */
  redirectTo?: string;
}

export function ConfirmAction({ trigger, title, description, confirmLabel, destructive = false, run, redirectTo }: ConfirmActionProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const confirm = () =>
    startTransition(async () => {
      const result = await run();
      if (!result.ok) {
        toast.error(result.error ?? "Action failed.");
        return;
      }
      toast.success(result.message ?? "Done.");
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });

  return (
    <AlertDialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>{description}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button variant={destructive ? "destructive" : "default"} onClick={confirm} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
