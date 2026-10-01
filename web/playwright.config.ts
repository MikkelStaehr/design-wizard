import { defineConfig } from "@playwright/test";

// Agents use 3100 (CLAUDE.md). E2E_PORT overrides it when another project's agent already holds 3100.
const port = Number(process.env.E2E_PORT ?? 3100);

// e2e runs against the built static export (pnpm build first), served on the agents' port 3100.
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
