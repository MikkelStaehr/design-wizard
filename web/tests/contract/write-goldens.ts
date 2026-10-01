// Run with `pnpm golden`, then review the diff in the commit. Never runs as part of `pnpm test`.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "vitest";
import { exportAll } from "@/export";
import { EXPORT_FILES, GOLDEN_DIR, validFixtures } from "./fixtures";

test("write goldens", () => {
  for (const { name, project } of validFixtures()) {
    const files = exportAll(project);
    mkdirSync(join(GOLDEN_DIR, name), { recursive: true });
    for (const file of EXPORT_FILES) writeFileSync(join(GOLDEN_DIR, name, file), files[file]);
  }
});
