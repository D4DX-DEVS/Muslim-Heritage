import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}

/** Title band shared by archive pages. */
export function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  return (
    <div className="border-b border-border bg-paper">
      <div className="mx-auto max-w-(--container-page) px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {children}
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">{eyebrow}</p>}
        <h1 className="mt-2 font-heading text-2xl font-bold text-heritage-900 sm:text-3xl lg:text-4xl">{title}</h1>
        {description && <div className="mt-3 max-w-3xl text-ink-soft">{description}</div>}
      </div>
    </div>
  );
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-(--container-page) px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}
