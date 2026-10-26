import { describe, expect, it } from "vitest";
import { sanitizeArticleHtml } from "@/lib/content/sanitize";

describe("sanitizeArticleHtml", () => {
  it("removes scripts, event handlers and javascript: URLs", () => {
    const out = sanitizeArticleHtml(
      `<p onclick="alert(1)">hi<script>alert(1)</script></p><a href="javascript:alert(1)">x</a><img src="x" onerror="alert(1)"><iframe src="https://evil"></iframe>`,
    );
    expect(out).not.toMatch(/script|onclick|onerror|javascript:|iframe/i);
    expect(out).toContain("<p>hi</p>");
  });

  it("keeps legacy formatting used in the proceedings", () => {
    const html = "<p><strong>ചരിത്രം</strong> text<sup>1</sup></p><address>അലസ്തു ബിറബ്ബികും</address><h5>ആമുഖം</h5>";
    expect(sanitizeArticleHtml(html)).toBe(html);
  });

  it("preserves Malayalam joiners (ZWJ/ZWNJ)", () => {
    const text = "കോണ്‍ഫറന്‍സ് മുസ്‌ലിം";
    expect(sanitizeArticleHtml(`<p>${text}</p>`)).toBe(`<p>${text}</p>`);
  });

  it("rewrites legacy absolute URLs to relative ones", () => {
    const out = sanitizeArticleHtml(
      `<img src="https://www.muslimheritage.in/uploads/article/p1.jpg"><a href="http://muslimheritage.in/innermore/2">x</a>`,
    );
    expect(out).toContain('src="/uploads/article/p1.jpg"');
    expect(out).toContain('href="/innermore/2"');
  });

  it("drops images that are neither hosted by us nor https", () => {
    expect(sanitizeArticleHtml('<img src="http://example.com/a.jpg"><img src="data:image/png;base64,AAA">')).toBe("");
  });

  it("marks external links noopener", () => {
    expect(sanitizeArticleHtml('<a href="https://example.com">x</a>')).toContain('rel="noopener noreferrer nofollow"');
  });

  it("demotes h1 to h2", () => {
    expect(sanitizeArticleHtml("<h1>T</h1>")).toBe("<h2>T</h2>");
  });
});
