import { expect, test } from "@playwright/test";

test.describe("public site", () => {
  test("homepage shows real archive content", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("കേരള മുസ്‌ലിം ഹിസ്റ്ററി കോണ്‍ഫറന്‍സ്");
    await expect(page.getByRole("heading", { name: "ആമുഖം" })).toBeVisible();
    await expect(page.locator('a[href="/innerindex/1"]').first()).toBeVisible();
  });

  test("article renders full Malayalam content, author and metadata", async ({ page }) => {
    const res = await page.goto("/innermore/1");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("ചരിത്രത്തെ");
    await expect(page.locator(".prose-heritage")).toContainText("ചരിത്രം ഇങ്ങനെയൊക്കെത്തന്നെയാണ് ഉണ്ടാവുന്നത്.");
    await expect(page.locator('a[href="/author/1"]').first()).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/innermore\/1$/);
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ld.some((t) => t.includes('"ScholarlyArticle"'))).toBe(true);
  });

  test("Malayalam text uses a Malayalam-capable font", async ({ page }) => {
    await page.goto("/innermore/1");
    const family = await page.locator("h1").evaluate((el) => getComputedStyle(el).fontFamily);
    expect(family.toLowerCase()).toMatch(/anek|malayalam/);
  });

  test("section listing paginates on the server", async ({ page }) => {
    await page.goto("/innerindex/13");
    await expect(page.getByText(/Page 1 of 2/)).toBeVisible();
    await page.getByRole("link", { name: "Next page" }).click();
    await expect(page).toHaveURL(/\/innerindex\/13\?page=2$/);
    await expect(page.getByText(/Page 2 of 2/)).toBeVisible();
  });

  test("search finds Malayalam and English terms", async ({ page }) => {
    await page.goto("/search?q=" + encodeURIComponent("മമ്പുറം"));
    await expect(page.getByRole("heading", { name: /Articles/ })).toBeVisible();
    await expect(page.locator('a[href^="/innermore/"]').first()).toBeVisible();
    await page.goto("/search?q=zzzznotfoundzzzz");
    await expect(page.getByText(/No results for/)).toBeVisible();
  });

  test("article filters keep state in the URL", async ({ page }) => {
    await page.goto("/articles?section=13&page=2");
    await expect(page.getByText(/Page 2 of 2/)).toBeVisible();
    await page.goto("/articles?page=999");
    await expect(page.getByText("This page doesn't exist")).toBeVisible();
  });

  test("author, boards, about, contact and gallery pages load", async ({ page }) => {
    for (const [path, text] of [
      ["/author/1", "ഡോ. ജമീല്‍ അഹ്മദ്"],
      ["/director", "Shaikh muhammed Karakunnu"],
      ["/advisory", "Dr. MGS Narayanan"],
      ["/about", "കേരള മുസ്‌ലിം ഹിസ്റ്ററി കോണ്‍ഫറന്‍സ്"],
      ["/contact", "heritagestudy13@gmail.com"],
      ["/gallery", "Photo gallery"],
      ["/confindex/1", "പ്രബന്ധസമാഹാരം"],
    ] as const) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(200);
      await expect(page.locator("main")).toContainText(text);
    }
  });

  test("migrated images are served from storage at legacy paths", async ({ request }) => {
    const res = await request.get("/uploads/article/amukham_1.jpg");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/jpeg");
    expect(res.headers()["cache-control"]).toContain("immutable");
  });

  test("unknown and malformed URLs return 404", async ({ request }) => {
    for (const path of ["/innermore/99999", "/innermore/abc", "/author/0", "/innerindex/999", "/does-not-exist", "/uploads/article/missing.jpg"]) {
      expect((await request.get(path)).status(), path).toBe(404);
    }
    // Encoded traversal is refused before reaching storage (Next answers 400).
    expect([400, 404]).toContain((await request.get("/uploads/..%2f..%2fwrangler.jsonc")).status());
  });

  test("sitemap lists articles; robots blocks non-production", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/innermore/145");
    expect((sitemap.match(/<url>/g) ?? []).length).toBeGreaterThan(300);
    expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /");
  });
});
