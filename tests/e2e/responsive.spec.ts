import { expect, test } from "@playwright/test";

const WIDTHS = [320, 375, 430, 768, 1024, 1366, 1920];
const PAGES = ["/", "/innermore/8", "/innerindex/13", "/articles", "/authors", "/author/1", "/confindex/1", "/advisory"];

for (const width of WIDTHS) {
  test(`no horizontal overflow or clipped headings at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of PAGES) {
      await page.goto(path);
      const result = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const overflowing = [...document.querySelectorAll("main *, header *, footer *")]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.right > vw + 1 && getComputedStyle(el).position !== "fixed";
          })
          .slice(0, 3)
          .map((el) => `${el.tagName}.${String((el as HTMLElement).className).slice(0, 50)}`);
        // Only headings that actually hide content (overflow not visible) count as clipped;
        // Malayalam glyphs legitimately extend past the line box.
        const clipped = [...document.querySelectorAll("h1, h2, h3")]
          .filter((el) => {
            const cs = getComputedStyle(el);
            const hides = cs.overflowX !== "visible" || cs.overflowY !== "visible";
            const clamped = cs.webkitLineClamp !== "none" && cs.webkitLineClamp !== "";
            return hides && !clamped && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 2);
          })
          .map((el) => el.textContent?.slice(0, 40));
        return { scroll: document.documentElement.scrollWidth - vw, overflowing, clipped };
      });
      expect(result.scroll, `${path} page scroll`).toBeLessThanOrEqual(0);
      expect(result.overflowing, `${path} overflowing`).toEqual([]);
      expect(result.clipped, `${path} clipped headings`).toEqual([]);
    }
  });
}

test("mobile menu opens as an accessible dialog", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("link", { name: "Authors" }).click();
  await expect(page).toHaveURL(/\/authors$/);
});
