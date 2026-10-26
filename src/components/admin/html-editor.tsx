"use client";

import { useRef, useState } from "react";
import { Bold, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Pilcrow, Quote, Superscript, TextQuote, type LucideIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaPickerDialog, type MediaItem } from "./media-picker";

// A source editor keeps legacy markup (verse in <address>, <sup> footnotes) exactly as
// migrated; WYSIWYG editors silently rewrite unknown tags. HTML is sanitised on save.

interface HtmlEditorProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
}

const PREVIEW_CSS = `
  body{font-family:"Noto Sans Malayalam","Inter",system-ui,sans-serif;line-height:1.9;color:#1d211c;background:#fffdf8;max-width:44rem;margin:1.5rem auto;padding:0 1rem;font-size:17px}
  h2,h3,h4,h5,h6{color:#0b2e22;line-height:1.35;margin-top:1.8em}
  address{font-style:normal;padding-left:1em;border-left:2px solid #ecdcae;color:#103d2d}
  blockquote{border-left:3px solid #c39633;padding-left:1em;color:#4f554b;font-style:italic;margin-left:0}
  img{max-width:100%;height:auto;border-radius:6px}
  sup{color:#8a6418} a{color:#175239}
`;

interface Tool {
  label: string;
  icon: LucideIcon;
  before: string;
  after: string;
  placeholder: string;
  image?: boolean;
}

const TOOLS: Tool[] = [
  { label: "Paragraph", icon: Pilcrow, before: "<p>", after: "</p>", placeholder: "text" },
  { label: "Heading 2", icon: Heading2, before: "<h2>", after: "</h2>", placeholder: "Heading" },
  { label: "Heading 3", icon: Heading3, before: "<h3>", after: "</h3>", placeholder: "Heading" },
  { label: "Bold", icon: Bold, before: "<strong>", after: "</strong>", placeholder: "" },
  { label: "Italic", icon: Italic, before: "<em>", after: "</em>", placeholder: "" },
  { label: "Footnote marker", icon: Superscript, before: "<sup>", after: "</sup>", placeholder: "1" },
  { label: "Quotation", icon: Quote, before: "<blockquote>", after: "</blockquote>", placeholder: "Quotation" },
  { label: "Verse line", icon: TextQuote, before: "<address>", after: "</address>", placeholder: "verse line" },
  { label: "Bulleted list", icon: List, before: "<ul>\n  <li>", after: "</li>\n</ul>", placeholder: "item" },
  { label: "Numbered list", icon: ListOrdered, before: "<ol>\n  <li>", after: "</li>\n</ol>", placeholder: "item" },
  { label: "Link", icon: Link2, before: '<a href="https://">', after: "</a>", placeholder: "link text" },
  { label: "Insert image", icon: ImagePlus, before: "", after: "", placeholder: "", image: true },
];

export function HtmlEditor({ id, value, onChange, invalid, describedBy }: HtmlEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [picker, setPicker] = useState(false);

  const apply = (before: string, after = "", placeholder = "") => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const selected = value.slice(s, e) || placeholder;
    const next = value.slice(0, s) + before + selected + after + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + selected.length);
    });
  };

  const runTool = (tool: Tool) => {
    if (tool.image) setPicker(true);
    else apply(tool.before, tool.after, tool.placeholder);
  };

  const insertImage = (m: MediaItem) => {
    const alt = (m.alt || "").replace(/"/g, "&quot;");
    apply(`<figure><img src="${m.url}" alt="${alt}"${m.width ? ` width="${m.width}" height="${m.height}"` : ""}><figcaption>`, "</figcaption></figure>\n", "Caption");
  };

  return (
    <Tabs defaultValue="write" className="gap-0">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-md border border-b-0 border-input bg-muted/60 p-1.5">
        <div role="toolbar" aria-label="Formatting" aria-controls={id} className="flex flex-wrap gap-0.5">
          {TOOLS.map((tool) => (
            <button
              key={tool.label}
              type="button"
              onClick={() => runTool(tool)}
              title={tool.label}
              aria-label={tool.label}
              className="inline-flex size-9 items-center justify-center rounded text-ink-soft hover:bg-paper hover:text-heritage-900"
            >
              <tool.icon className="size-4" />
            </button>
          ))}
        </div>
        <TabsList className="h-9">
          <TabsTrigger value="write">HTML</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="write" className="mt-0">
        <textarea
          ref={ref}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className="block min-h-[28rem] w-full resize-y rounded-b-md border border-input bg-paper p-3 font-mono text-[13px] leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 aria-invalid:border-destructive"
          lang="ml"
        />
      </TabsContent>
      <TabsContent value="preview" className="mt-0">
        {/* sandbox without allow-scripts: nothing in the draft can execute. */}
        <iframe
          title="Article preview"
          sandbox=""
          srcDoc={`<!doctype html><html lang="ml"><head><meta charset="utf-8"><style>${PREVIEW_CSS}</style></head><body>${value}</body></html>`}
          className="block h-[28rem] w-full rounded-b-md border border-input bg-paper"
        />
      </TabsContent>
      <MediaPickerDialog open={picker} onOpenChange={setPicker} onSelect={insertImage} />
    </Tabs>
  );
}
