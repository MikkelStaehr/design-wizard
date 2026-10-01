// C6 (docs/CONTRACTS.md §7): project files round-trip byte for byte; invalid files list every
// problem at once and leave the store unchanged.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { parse } from "@/data/project/parse";
import { serialize } from "@/data/project/serialize";
import { createProjectStore } from "@/data/project/store";

const dir = join(__dirname, "..", "..", "fixtures");
const read = (name: string) => readFileSync(join(dir, name), "utf8");
const valid = readdirSync(dir).filter((f) => f.endsWith(".project.json") && !f.startsWith("invalid-"));

describe("C6 project file", () => {
  test.each(valid)("%s round-trips byte for byte", (name) => {
    const bytes = read(name);
    const result = parse(bytes);
    expect(result.ok ? [] : result.errors).toEqual([]);
    if (result.ok) expect(serialize(result.project)).toBe(bytes);
  });

  test("invalid-many lists every problem, in field order", () => {
    const result = parse(read("invalid-many.project.json"));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    const expected = JSON.parse(read("invalid-many.errors.json"));
    expect(result.errors.map(({ path, code }) => ({ path, code }))).toEqual(expected);
    expect(expected.length).toBeGreaterThanOrEqual(8);
    for (const e of result.errors) expect(e.message.length).toBeGreaterThan(10);
  });

  test("truncated JSON gives one json-syntax error with line:col", () => {
    const result = parse(read("invalid-syntax.txt"));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe("json-syntax");
    expect(result.errors[0].message).toMatch(/line \d+:\d+/);
  });

  test("a newer schemaVersion gives one schema-version error", () => {
    const result = parse(read("invalid-version.project.json"));
    expect(result.ok ? [] : result.errors.map((e) => e.code)).toEqual(["schema-version"]);
  });

  test("never coerces: a numeric string is a type error", () => {
    const text = read("harbour.project.json").replace('"radius": 8,', '"radius": "8",');
    const result = parse(text);
    expect(result.ok ? [] : result.errors.map(({ path, code }) => `${path}:${code}`)).toContain("visual.radius:type");
  });

  test("another JSON file is rejected by format", () => {
    const result = parse('{"$description": "tokens"}');
    expect(result.ok ? [] : result.errors.map((e) => e.code)).toEqual(["format"]);
  });

  test.each(["invalid-many.project.json", "invalid-syntax.txt", "invalid-version.project.json"])(
    "%s leaves the store state unchanged",
    (name) => {
      const store = createProjectStore(null);
      expect(store.open(read("harbour.project.json"))).toEqual([]);
      const before = store.getState().project;
      const errors = store.open(read(name));
      expect(errors.length).toBeGreaterThan(0);
      expect(store.getState().project).toBe(before);
      expect(store.getState().errors).toEqual(errors);
    },
  );
});
