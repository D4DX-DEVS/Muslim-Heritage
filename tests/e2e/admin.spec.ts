import { expect, test, type Page } from "@playwright/test";

const USER = process.env.E2E_ADMIN_USERNAME ?? "admin";
const PASSWORD = process.env.E2E_ADMIN_PASSWORD;

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Username").fill(USER);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test.describe("admin security", () => {
  test("protected pages redirect and APIs reject anonymous requests", async ({ request }) => {
    for (const path of ["/admin", "/admin/articles", "/admin/articles/1", "/admin/media"]) {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status(), path).toBe(307);
      expect(res.headers()["location"]).toContain("/admin/login");
    }
    expect((await request.get("/admin/api/media")).status()).toBe(401);
    expect((await request.post("/admin/api/media", { multipart: { file: { name: "a.png", mimeType: "image/png", buffer: Buffer.from("x") } } })).status()).toBe(401);
  });

  test("invalid credentials are rejected", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Username").fill("nobody");
    await page.getByLabel("Password", { exact: true }).fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator("form [role=alert]")).toContainText(/Incorrect username or password|Too many failed attempts/);
    await expect(page).toHaveURL(/\/admin\/login$/);
  });
});

test.describe("admin content workflow", () => {
  test.skip(!PASSWORD, "Set E2E_ADMIN_PASSWORD to run admin workflow tests");

  test("create draft → hidden → publish → searchable → unpublish → restore → delete", async ({ page, request }) => {
    const title = `E2E പരീക്ഷണ ലേഖനം ${Date.now()}`;
    await login(page);

    // Session cookie is HttpOnly.
    expect(await page.evaluate(() => document.cookie)).not.toContain("mh_admin");

    await page.goto("/admin/articles/new");
    await page.getByLabel("Title", { exact: true }).fill(title);
    await page.locator("#bodyHtml").fill("<p>ഇത് ഒരു പരീക്ഷണ ലേഖനമാണ്. uniquee2eword</p><script>alert(1)</script>");
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page).toHaveURL(/\/admin\/articles\/\d+$/, { timeout: 30_000 });
    const id = Number(page.url().split("/").pop());

    // Draft is not public.
    expect((await request.get(`/innermore/${id}`)).status()).toBe(404);

    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.getByText("Article saved and published.")).toBeVisible({ timeout: 30_000 });
    const pub = await request.get(`/innermore/${id}`);
    expect(pub.status()).toBe(200);
    const html = await pub.text();
    expect(html).toContain("uniquee2eword");
    expect(html).not.toContain("<script>alert(1)</script>");

    const search = await (await request.get(`/search?q=uniquee2eword`)).text();
    expect(search).toContain(`/innermore/${id}`);

    // Unpublish through the confirmation dialog.
    await page.getByRole("button", { name: "Unpublish" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Unpublish" }).click();
    await expect(page.getByText("Article moved to drafts.")).toBeVisible({ timeout: 30_000 });
    expect((await request.get(`/innermore/${id}`)).status()).toBe(404);

    // Revision history recorded the earlier versions; restore one.
    await page.reload();
    const restore = page.getByRole("button", { name: "Restore" }).first();
    await expect(restore).toBeVisible();
    await restore.click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Restore" }).click();
    await expect(page.getByText(/Revision restored/)).toBeVisible({ timeout: 30_000 });

    // Validation error is shown inline. Reload first: the restore refreshes the form with
    // the restored values, which would otherwise race the edit below.
    await page.reload();
    await page.getByLabel("Title", { exact: true }).fill("");
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.getByText("Title is required")).toBeVisible();

    await page.reload();
    await page.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete article" }).click();
    await expect(page).toHaveURL(/\/admin\/articles$/, { timeout: 30_000 });
  });

  test("media upload rejects disguised files and refuses deleting used media", async ({ page }) => {
    await login(page);
    const res = await page.request.post("/admin/api/media", {
      multipart: { file: { name: "evil.jpg", mimeType: "image/jpeg", buffer: Buffer.from("<html><script>alert(1)</script></html>") } },
      headers: { origin: new URL(page.url()).origin },
    });
    expect(res.status()).toBe(422);

    await page.goto("/admin/media?q=amukham_1");
    await page.getByRole("button", { name: /amukham_1\.jpg/ }).click();
    await expect(page.getByText(/Article:/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete file" })).toBeDisabled();
  });

  test("logout invalidates the session", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "Sign out" }).first().click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });
});
