import { defineConfig } from "@playwright/test";

// design-wizard's own agent port (CLAUDE.md, Environment).
const port = 3110;

// e2e runs against the built static export (pnpm build first), served on the agent port.
// Edge is used because it is installed on the dev machine; no browser download is needed.
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${port}`,
    channel: "msedge",
  },
  projects: [
    { name: "desktop-1280", use: { viewport: { width: 1280, height: 900 } } },
    { name: "mobile-390", use: { viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: `node scripts/serve-out.mjs --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
  },
});
