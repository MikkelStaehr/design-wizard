import { defineConfig } from "@playwright/test";

// e2e runs against the built static export (pnpm build first), served on the agents' port 3100.
// Edge is used because it is installed on the dev machine; no browser download is needed.
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    channel: "msedge",
  },
  projects: [
    { name: "desktop-1280", use: { viewport: { width: 1280, height: 900 } } },
    { name: "mobile-390", use: { viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: "node scripts/serve-out.mjs --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
  },
});
