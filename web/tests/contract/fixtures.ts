// Shared fixture access for the contract tests and the golden writer.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { ProjectFile } from "@/contracts/project";
import { parse } from "@/data/project/parse";

export const FIXTURES_DIR = join(__dirname, "..", "..", "fixtures");
export const GOLDEN_DIR = join(__dirname, "golden");
export const EXPORT_FILES = ["DESIGN.md", "tokens.json", "ux-rules.yaml"] as const;

/** Every valid project fixture by name (file name without `.project.json`). */
export function validFixtures(): { name: string; project: ProjectFile }[] {
  return readdirSync(FIXTURES_DIR)
    .filter((f) => f.endsWith(".project.json") && !f.startsWith("invalid-"))
    .sort()
    .map((f) => {
      const result = parse(readFileSync(join(FIXTURES_DIR, f), "utf8"));
      if (!result.ok) throw new Error(`${f} does not parse: ${JSON.stringify(result.errors)}`);
      return { name: f.replace(/\.project\.json$/, ""), project: result.project };
    });
}

export function readGolden(fixture: string, file: string): string {
  return readFileSync(join(GOLDEN_DIR, fixture, file), "utf8");
}
