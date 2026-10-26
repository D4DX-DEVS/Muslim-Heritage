"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export interface FieldDef {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "select";
  required?: boolean;
  options?: { value: string; label: string }[];
  hint?: string;
}

interface RecordDialogProps {
  trigger: ReactNode;
  title: string;
  description?: string;
  fields: FieldDef[];
  initial: Record<string, string>;
  submit: (values: Record<string, string>) => Promise<{ ok: boolean; error?: string; message?: string; fieldErrors?: Record<string, string> }>;
}

/** Small create/edit dialog for simple records (sections, board members). Server re-validates. */
export function RecordDialog({ trigger, title, description, fields, initial, submit }: RecordDialogProps) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const missing = Object.fromEntries(fields.filter((f) => f.required && !values[f.name]?.trim()).map((f) => [f.name, `${f.label} is required`]));
    setErrors(missing);
    if (Object.keys(missing).length) return;
    startTransition(async () => {
      const result = await submit(values);
      if (!result.ok) {
        setErrors(Object.fromEntries(Object.entries(result.fieldErrors ?? {}).map(([k, v]) => [k.replace(/^data\./, ""), v])));
        toast.error(result.error ?? "Could not save.");
        return;
      }
      toast.success(result.message ?? "Saved.");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (pending) return;
        setOpen(o);
        if (o) {
          setValues(initial);
          setErrors({});
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {fields.map((f) => {
            const id = `field-${f.name}`;
            const err = errors[f.name];
            const common = {
              id,
              "aria-invalid": err ? true : undefined,
              "aria-describedby": err ? `${id}-error` : undefined,
            };
            return (
              <div key={f.name} className="space-y-1.5">
                <Label htmlFor={id}>{f.label}</Label>
                {f.type === "textarea" ? (
                  <Textarea {...common} lang="ml" rows={3} value={values[f.name] ?? ""} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />
                ) : f.type === "select" ? (
                  <Select value={values[f.name]} onValueChange={(v) => setValues({ ...values, [f.name]: v })}>
                    <SelectTrigger id={id} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options?.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    {...common}
                    lang="ml"
                    type={f.type === "number" ? "number" : "text"}
                    inputMode={f.type === "number" ? "numeric" : undefined}
                    value={values[f.name] ?? ""}
                    onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                  />
                )}
                {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
                {err && (
                  <p id={`${id}-error`} className="text-sm text-destructive">
                    {err}
                  </p>
                )}
              </div>
            );
          })}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
