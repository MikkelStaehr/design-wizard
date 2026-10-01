import { expect, test } from "@playwright/test";

test("the shell renders and makes no request outside localhost", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (req) => {
    const { hostname, protocol } = new URL(req.url());
    if (protocol.startsWith("http") && hostname !== "localhost") external.push(req.url());
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Project profile" })).toBeVisible();
  await page.waitForLoadState("networkidle");

  expect(external).toEqual([]);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
