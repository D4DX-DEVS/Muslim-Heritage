import { JsonLd } from "./json-ld";

export interface Crumb {
  label: string;
  href?: string;
}

/** Breadcrumb trail as structured data only; not rendered visibly. */
export function Breadcrumbs({ items, siteUrl }: { items: Crumb[]; siteUrl: string }) {
  const all: Crumb[] = [{ label: "Home", href: "/" }, ...items];
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: all.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.label,
          ...(c.href ? { item: `${siteUrl}${c.href}` } : {}),
        })),
      }}
    />
  );
}
