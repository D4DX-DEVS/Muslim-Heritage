"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Option {
  id: number;
  name: string;
}

export function AuthorPicker({ options, value, onChange }: { options: Option[]; value: number[]; onChange: (ids: number[]) => void }) {
  const [q, setQ] = useState("");
  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (term ? options.filter((o) => o.name.toLowerCase().includes(term)) : options).slice(0, 50);
  }, [q, options]);

  const toggle = (id: number) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Selected authors">
          {value.map((id) => (
            <li key={id} className="inline-flex items-center gap-1 rounded-full bg-heritage-100 py-1 pl-3 pr-1 text-sm text-heritage-900">
              {byId.get(id)?.name ?? `#${id}`}
              <button type="button" onClick={() => toggle(id)} className="inline-flex size-6 items-center justify-center rounded-full hover:bg-heritage-600/15" aria-label={`Remove ${byId.get(id)?.name ?? id}`}>
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find author…" aria-label="Find author" className="pl-9" />
      </div>
      <ul className="max-h-48 overflow-y-auto rounded-md border border-border bg-paper" role="listbox" aria-multiselectable="true" aria-label="Authors">
        {filtered.map((o) => {
          const selected = value.includes(o.id);
          return (
            <li key={o.id} role="option" aria-selected={selected}>
              <label className="flex min-h-10 cursor-pointer items-center gap-2 px-3 text-sm hover:bg-accent">
                <input type="checkbox" checked={selected} onChange={() => toggle(o.id)} className="size-4 accent-heritage-700" />
                {o.name}
              </label>
            </li>
          );
        })}
        {filtered.length === 0 && <li className="px-3 py-3 text-sm text-muted-foreground">No author found. Add one under Authors first.</li>}
      </ul>
    </div>
  );
}
