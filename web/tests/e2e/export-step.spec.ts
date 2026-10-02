// Step 5, export (design/specs/step-5-export.md): smoke tests against the built export (no ?fixture=).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const KEY = "design-wizard:v1:project";

/** Seeds Harbour into the autosave once per tab, never downloaded. */
async function seedHarbour(page: Page) {
  const p = JSON.parse(readFileSync(resolve("fixtures/harbour.project.json"), "utf8"));
  const envelope = JSON.stringify({ savedAt: "2026-10-01T09:00:00.000Z", downloadedAt: null, file: JSON.stringify(p, null, 2) + "\n" });
  await page.addInitScript(
    ([key, value]) => {
      if (sessionStorage.getItem("seeded")) return;
      sessionStorage.setItem("seeded", "1");
      localStorage.setItem(key, value);
    },
    [KEY, envelope],
  );
}

const h1 = (page: Page, name: string) => page.getByRole("heading", { level: 1, name });
const bar = (page: Page) => page.locator("main [data-primary-action]");

test("blocked: an empty project lists all 10 open decisions and offers no export downloads", async ({ page }) => {
  await page.goto("/?step=export");
  await expect(h1(page, "Export")).toBeFocused();
  await expect(page.getByRole("heading", { name: "STILL OPEN · 10" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Decide / })).toHaveCount(10);
  for (const f of ["DESIGN.md", "tokens.json", "ux-rules.yaml"]) await expect(page.getByRole("button", { name: `Download ${f}` })).toHaveCount(0);
  await expect(page.getByText("10 DECISIONS OPEN · NO PROJECT FILE YET")).toBeVisible();
  await expect(bar(page)).toHaveText(/Go to Project name/);
});

test("ready: 4 rows, each byte count equals the UTF-8 length of its text", async ({ page }) => {
  await seedHarbour(page);
  await page.goto("/?step=export");
  await expect(h1(page, "Export")).toBeVisible();
  const rows = page.locator("main li[data-file]");
  await expect(rows).toHaveCount(4);
  await expect(rows.first()).toHaveAttribute("data-file", "harbour.dwproj.json");
  for (let i = 0; i < 4; i++) {
    const row = rows.nth(i);
    await row.getByText("Show text").click();
    const bytes = await row.locator("pre").evaluate((el) => new TextEncoder().encode(el.textContent ?? "").length);
    await expect(row.locator("[data-meta]")).toHaveText(new RegExp(`^${bytes.toLocaleString("en-GB")} bytes`));
  }
  await expect(page.getByText(/^4 rules · 3 must · 1 should: /)).toBeVisible();
});

test("only the project file marks the project downloaded", async ({ page }) => {
  await seedHarbour(page);
  await page.goto("/?step=export");
  await expect(page.getByText("NO PROJECT FILE YET")).toBeVisible();
  const md = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download DESIGN.md" }).click();
  expect((await md).suggestedFilename()).toBe("DESIGN.md");
  await expect(page.getByText("NO PROJECT FILE YET")).toBeVisible();
  const proj = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download harbour.dwproj.json" }).click();
  expect((await proj).suggestedFilename()).toBe("harbour.dwproj.json");
  await expect(page.getByText("PROJECT FILE UP TO DATE")).toBeVisible();
  await expect(page.getByRole("button", { name: "Download harbour.dwproj.json" })).toBeFocused();
});

test("opening a valid file replaces the project; Undo open restores it", async ({ page }) => {
  await seedHarbour(page);
  await page.goto("/?step=export");
  await expect(h1(page, "Export")).toBeVisible();
  await page.locator("main section input[type=file]").setInputFiles(resolve("fixtures/edge-name.project.json"));
  const title = page.locator("#opened-title");
  await expect(title).toHaveText("Opened edge-name.project.json.");
  await expect(title).toBeFocused();
  await expect(page.getByText("It replaced Harbour, which had changes in no downloaded file.")).toBeVisible();
  await expect(page.locator("main li[data-file]").first()).not.toHaveAttribute("data-file", "harbour.dwproj.json");
  await page.getByRole("button", { name: "Undo open" }).click();
  await expect(title).toHaveText("Back to Harbour.");
  await expect(title).toBeFocused();
  await expect(page.locator("main li[data-file]").first()).toHaveAttribute("data-file", "harbour.dwproj.json");
});
