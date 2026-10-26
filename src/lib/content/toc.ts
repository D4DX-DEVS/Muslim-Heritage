import { htmlToText } from "./text";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

/** Adds ids to h2–h5 in sanitised article HTML and returns a table of contents. */
export function withHeadingIds(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const out = html.replace(/<h([2-5])>([\s\S]*?)<\/h\1>/g, (_m, level: string, inner: string) => {
    const text = htmlToText(inner);
    if (!text) return `<h${level}>${inner}</h${level}>`;
    const id = `section-${toc.length + 1}`;
    toc.push({ id, text, level: Number(level) });
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });
  return { html: out, toc };
}
