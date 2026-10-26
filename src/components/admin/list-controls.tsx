"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ADMIN_PAGE_SIZES } from "@/lib/admin/params";

interface FilterDef {
  param: string;
  label: string;
  allLabel: string;
  options: { value: string; label: string }[];
}

function useUrlUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const update = (patch: Record<string, string | null>, resetPage = true) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (resetPage) next.delete("page");
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };
  return { params, update, pending, clear: () => startTransition(() => router.replace(pathname, { scroll: false })) };
}

export function AdminFilters({ searchLabel, filters = [] }: { searchLabel: string; filters?: FilterDef[] }) {
  const { params, update, pending, clear } = useUrlUpdater();
  const [q, setQ] = useState(params.get("q") ?? "");
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const t = setTimeout(() => update({ q: q.trim() || null }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce on input only
  }, [q]);

  const active = Boolean(params.get("q") || filters.some((f) => params.get(f.param)));

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="min-w-0 flex-1 space-y-1.5 sm:min-w-56">
        <Label htmlFor="admin-q">{searchLabel}</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input id="admin-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} className="h-10 bg-paper pl-9" maxLength={200} />
          {pending && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-label="Loading" />}
        </div>
      </div>
      {filters.map((f) => (
        <div key={f.param} className="space-y-1.5 sm:w-52">
          <Label htmlFor={`admin-${f.param}`}>{f.label}</Label>
          <Select value={params.get(f.param) ?? "all"} onValueChange={(v) => update({ [f.param]: v === "all" ? null : v })}>
            <SelectTrigger id={`admin-${f.param}`} className="h-10 w-full bg-paper">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{f.allLabel}</SelectItem>
              {f.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
      {active && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            clear();
          }}
          className="inline-flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-heritage-700 hover:bg-accent"
        >
          <X className="size-4" aria-hidden="true" /> Clear filters
        </button>
      )}
    </div>
  );
}

export function RowsPerPage({ value }: { value: number }) {
  const { update } = useUrlUpdater();
  return (
    <div className="flex items-center gap-2 text-sm">
      <Label htmlFor="rows-per-page" className="font-normal text-muted-foreground">
        Rows per page
      </Label>
      <Select value={String(value)} onValueChange={(v) => update({ pageSize: v === "20" ? null : v })}>
        <SelectTrigger id="rows-per-page" className="h-9 w-20 bg-paper">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ADMIN_PAGE_SIZES.map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
