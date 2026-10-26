import type { ReactNode } from "react";
import { FileSearch, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface StateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: StateProps) {
  return (
    <div className={cn("flex flex-col items-center rounded-lg border border-dashed border-border bg-paper px-6 py-12 text-center", className)}>
      <FileSearch className="size-8 text-gold-600" aria-hidden="true" />
      <h2 className="mt-3 text-lg font-semibold text-heritage-900">{title}</h2>
      {description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ title, description, action, className }: StateProps) {
  return (
    <div role="alert" className={cn("flex flex-col items-center rounded-lg border border-destructive/30 bg-paper px-6 py-12 text-center", className)}>
      <TriangleAlert className="size-8 text-destructive" aria-hidden="true" />
      <h2 className="mt-3 text-lg font-semibold">{title}</h2>
      {description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
