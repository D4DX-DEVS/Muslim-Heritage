"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Option {
  value: string;
  label: string;
}

interface ListingToolbarProps {
  searchLabel: string;
  sections?: Option[];
  sorts?: Option[];
}

/** Search + filters that live in the URL; any change resets to page 1. */
export function ListingToolbar({ searchLabel, sections, sorts }: ListingToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const first = useRef(true);

  const push = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page");
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      if ((params.get("q") ?? "") !== q.trim()) push({ q: q.trim() || null });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce only on input change
  }, [q]);

  const active = Boolean(params.get("q") || params.get("section") || params.get("sort"));

  return (
    <form
      role="search"
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        push({ q: q.trim() || null });
      }}
    >
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="listing-q">{searchLabel}</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="listing-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Title, author or text — മലയാളത്തിലും തിരയാം"
            className="h-11 bg-paper pl-9"
            maxLength={200}
          />
          {pending && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-label="Loading" />}
        </div>
      </div>
      {sections && (
        <div className="space-y-1.5 sm:w-64">
          <Label htmlFor="listing-section">Section</Label>
          <Select value={params.get("section") ?? "all"} onValueChange={(v) => push({ section: v === "all" ? null : v })}>
            <SelectTrigger id="listing-section" className="h-11 w-full bg-paper">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sections</SelectItem>
              {sections.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {sorts && (
        <div className="space-y-1.5 sm:w-44">
          <Label htmlFor="listing-sort">Sort</Label>
          <Select value={params.get("sort") ?? "default"} onValueChange={(v) => push({ sort: v === "default" ? null : v })}>
            <SelectTrigger id="listing-sort" className="h-11 w-full bg-paper">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sorts.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {active && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            startTransition(() => router.replace(pathname, { scroll: false }));
          }}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium text-heritage-700 hover:bg-accent"
        >
          <X className="size-4" aria-hidden="true" /> Clear
        </button>
      )}
    </form>
  );
}
