import { describe, expect, it } from "vitest";
import { htmlToText, isMalayalam, readingMinutes, summarize } from "@/lib/content/text";
import { withHeadingIds } from "@/lib/content/toc";
import { listingHref, parseId, parseListing } from "@/lib/params";
import { buildMatchExpression } from "@/lib/search-core";

describe("text helpers", () => {
  it("converts HTML to text and decodes entities incl. joiners", () => {
    expect(htmlToText("<p>a&nbsp;b</p><p>മുസ്&zwnj;ലിം</p>")).toBe("a b മുസ്‌ലിം");
  });

  it("summarises on a word boundary", () => {
    const s = summarize("one two three four five six seven", 15);
    expect(s.endsWith("…")).toBe(true);
    expect(s.length).toBeLessThanOrEqual(16);
  });

  it("estimates at least one minute", () => {
    expect(readingMinutes("")).toBe(1);
    expect(readingMinutes("w ".repeat(1500))).toBe(10);
  });

  it("detects Malayalam", () => {
    expect(isMalayalam("ചരിത്രം")).toBe(true);
    expect(isMalayalam("history")).toBe(false);
  });
});

describe("table of contents", () => {
  it("adds ids to headings and lists them", () => {
    const { html, toc } = withHeadingIds("<h5>ആമുഖം</h5><p>x</p><h3>B</h3>");
    expect(html).toBe('<h5 id="section-1">ആമുഖം</h5><p>x</p><h3 id="section-2">B</h3>');
    expect(toc).toEqual([
      { id: "section-1", text: "ആമുഖം", level: 5 },
      { id: "section-2", text: "B", level: 3 },
    ]);
  });
});

describe("listing params", () => {
  it("falls back to safe defaults for invalid input", () => {
    expect(parseListing({ page: "-3", q: ["abc", "d"], section: "x", sort: "evil" })).toEqual({ page: 1, q: "abc", section: undefined, sort: "default" });
  });

  it("keeps filters when building page links", () => {
    expect(listingHref("/articles", { q: "മലബാര്‍", section: 5, page: 2 })).toBe("/articles?q=%E0%B4%AE%E0%B4%B2%E0%B4%AC%E0%B4%BE%E0%B4%B0%E0%B5%8D%E2%80%8D&section=5&page=2");
    expect(listingHref("/articles", { page: 1 })).toBe("/articles");
  });

  it("parses only positive integer ids", () => {
    expect(parseId("12")).toBe(12);
    expect(parseId("0")).toBeNull();
    expect(parseId("12abc")).toBeNull();
    expect(parseId("../1")).toBeNull();
  });
});

describe("search expression", () => {
  it("quotes terms and drops ones shorter than the trigram minimum", () => {
    expect(buildMatchExpression('മലബാര്‍ ab "x" history')).toBe('"മലബാര്‍" AND "history"');
    expect(buildMatchExpression("ab")).toBeNull();
  });
});

describe("LIKE escaping", () => {
  it("escapes wildcards and backslashes", async () => {
    const { likePattern } = await import("@/lib/search-core");
    expect(likePattern("amukham_1")).toBe("%amukham\\_1%");
    expect(likePattern("100%")).toBe("%100\\%%");
    expect(likePattern("a\\b")).toBe("%a\\\\b%");
  });
});
