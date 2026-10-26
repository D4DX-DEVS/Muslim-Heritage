import sanitizeHtml from "sanitize-html";

// Shared by the migration importer (Node) and admin saves (Worker). Article HTML is
// sanitised before it is stored, so rendering can trust the stored value.

const LEGACY_ORIGIN = /^https?:\/\/(www\.)?muslimheritage\.in(?=\/)/i;

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "sup", "sub", "small", "mark",
    "h2", "h3", "h4", "h5", "h6", "blockquote", "address", "cite", "q",
    "ul", "ol", "li", "a", "img", "figure", "figcaption", "span", "div",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "width", "height", "title"],
    th: ["colspan", "rowspan", "scope"],
    td: ["colspan", "rowspan"],
    ol: ["start"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["https"] },
  allowProtocolRelative: false,
  transformTags: {
    // Legacy pages used h1 inside article bodies; the page title owns the only h1.
    h1: "h2",
    a: (tagName, attribs) => {
      const href = (attribs.href ?? "").replace(LEGACY_ORIGIN, "");
      const attrs: sanitizeHtml.Attributes = /^https?:/i.test(href)
        ? { href, target: "_blank", rel: "noopener noreferrer nofollow" }
        : { href };
      return { tagName, attribs: attrs };
    },
    img: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, src: (attribs.src ?? "").replace(LEGACY_ORIGIN, "") },
    }),
  },
  // Only images we host (/uploads/…) or absolute https images survive.
  exclusiveFilter: (frame) =>
    frame.tag === "img" && !/^(\/uploads\/|https:\/\/)/.test(frame.attribs.src ?? ""),
};

export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, OPTIONS)
    .replace(/<p>(\s|&nbsp;)*<\/p>/g, "")
    .trim();
}
