import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  crumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
}

export function AdminPageHeader({ title, description, crumbs = [], actions }: AdminPageHeaderProps) {
  return (
    <div className="mb-6 space-y-2 lg:mb-8">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <li>
            <Link href="/admin" className="hover:underline">
              Admin
            </Link>
          </li>
          {crumbs.map((c) => (
            <li key={c.label} className="flex items-center gap-1.5">
              <ChevronRight className="size-3" aria-hidden="true" />
              {c.href ? (
                <Link href={c.href} className="hover:underline">
                  {c.label}
                </Link>
              ) : (
                <span aria-current="page">{c.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-xl font-bold text-heritage-900 sm:text-2xl">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}
