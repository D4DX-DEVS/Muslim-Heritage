const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#039;": "'",
  "&#39;": "'",
  "&zwj;": "‍",
  "&zwnj;": "‌",
};

export function htmlToText(html: string): string {
  return html
    .replace(/<(br|\/p|\/h\d|\/li|\/address|\/blockquote|\/div)\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&[#a-z0-9]+;/gi, (e) => ENTITIES[e.toLowerCase()] ?? " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Summary cut on a word boundary; keeps Malayalam conjuncts intact. */
export function summarize(text: string, maxChars = 220): string {
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > maxChars * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

/** Malayalam words are long; ~150 words/min is a reasonable reading rate for both scripts. */
export function readingMinutes(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 150));
}

export function isMalayalam(text: string): boolean {
  return /[ഀ-ൿ]/.test(text);
}
