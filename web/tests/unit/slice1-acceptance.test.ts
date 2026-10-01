// Tester: slice 1 acceptance checks (docs/PLAN.md AC8, AC9, AC10 at data/export level + messy input).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import type { ProjectFile } from "@/contracts/project";
import { emptyProject } from "@/data/project/empty";
import { parse } from "@/data/project/parse";
import { serialize } from "@/data/project/serialize";
import { createProjectStore } from "@/data/project/store";
import { STORAGE_KEY } from "@/data/project/storage";
import { exportAll } from "@/export";

const FIX = join(__dirname, "..", "..", "fixtures");
const read = (f: string) => readFileSync(join(FIX, f), "utf8");
const harbourText = read("harbour.project.json");
const load = (text: string): ProjectFile => {
  const r = parse(text);
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  return r.project;
};
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const codes = (text: string) => {
  const r = parse(text);
  return r.ok ? [] : r.errors.map((e) => `${e.path}:${e.code}`);
};

class MemStorage implements Storage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.get(k) ?? null; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  removeItem(k: string) { this.m.delete(k); }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
}

describe("AC8: export refuses while any decision is open; nothing is filled in", () => {
  test("a new project has every decision null and no default values", () => {
    const p = emptyProject();
    expect(p.profile).toEqual({ name: null, productType: null, platform: null, notes: "", componentLibrary: "shadcn" });
    expect(p.principles).toBeNull();
    expect(p.visual).toEqual({ fontPair: null, spacingBase: null, radius: null, density: null, brandHex: null, paletteVariant: null, colorOverrides: {} });
    expect(p.resolved).toBeNull();
  });

  test("exportAll throws on a new (all-open) project", () => {
    expect(() => exportAll(emptyProject())).toThrow(/blocked/);
  });

  test("exportAll throws when resolved is null even though all other decisions are set", () => {
    const p = clone(load(harbourText));
    p.resolved = null;
    expect(() => exportAll(p)).toThrow(/blocked/);
  });

  test("an open decision with a radius of null round-trips as null, never 0", () => {
    const p = emptyProject();
    const back = load(serialize(p));
    expect(back.visual.radius).toBeNull();
    expect(serialize(p)).toContain('"radius": null');
  });

  // The parser rejects these shapes, but exportAll takes any ProjectFile (store.replace does not validate).
  test.each([
    ["profile.platform", (p: ProjectFile) => { p.profile.platform = null; }],
    ["profile.productType", (p: ProjectFile) => { p.profile.productType = null; }],
    ["principles", (p: ProjectFile) => { p.principles = null; }],
    ["visual.density", (p: ProjectFile) => { p.visual.density = null; }],
    ["visual.brandHex", (p: ProjectFile) => { p.visual.brandHex = null; }],
    ["visual.paletteVariant", (p: ProjectFile) => { p.visual.paletteVariant = null; }],
    ["visual.spacingBase", (p: ProjectFile) => { p.visual.spacingBase = null; }],
  ])("exportAll refuses when %s is open even if resolved is stale-filled", (_name, open) => {
    const p = clone(load(harbourText));
    open(p);
    expect(() => exportAll(p)).toThrow();
  });
});

describe("AC9: radius 8 → 0 changes only radius lines; 0 exported as 0", () => {
  const h = exportAll(load(harbourText));
  const z = exportAll(load(read("edge-radius-0.project.json")));
  test.each(["DESIGN.md", "tokens.json", "ux-rules.yaml"] as const)("%s differs only on radius lines", (file) => {
    const a = h[file].split("\n");
    const b = z[file].split("\n");
    expect(b.length).toBe(a.length);
    const diff = a.map((line, i) => [line, b[i]]).filter(([x, y]) => x !== y);
    for (const [x, y] of diff) {
      // tokens.json: the "value" line inside radius.base; DESIGN.md: Radius and --radius lines.
      expect(`${x}\n${y}`).toMatch(file === "tokens.json" ? /"value": (8|0),/ : /radius/i);
    }
    if (file === "tokens.json") {
      expect(diff).toEqual([['        "value": 8,', '        "value": 0,']]);
      const t = JSON.parse(z[file]);
      expect(t.radius.base.$value).toEqual({ value: 0, unit: "px" });
      const t8 = JSON.parse(h[file]);
      const strip = (x: { radius?: unknown }) => ({ ...x, radius: undefined });
      expect(strip(t)).toEqual(strip(t8));
    }
    if (file === "DESIGN.md") {
      expect(diff.map(([, y]) => y)).toEqual(["  --radius: 0px; /* radius.base */", "- **Radius:** 0px"]);
    }
    if (file === "ux-rules.yaml") expect(diff).toEqual([]);
  });

  test("editing harbour's radius to 0 in memory gives the edge-radius-0 exports byte for byte", () => {
    const p = clone(load(harbourText));
    p.visual.radius = 0;
    p.resolved!.radius = 0;
    expect(exportAll(p)).toEqual(z);
  });
});

describe("AC10: save → reopen restores every decision and byte-identical exports", () => {
  const all = ["harbour", "edge-radius-0", "edge-yellow", "edge-single-family", "edge-name", "edge-no-shadcn", "edge-zero-laws"];
  test.each(all)("%s: parse → serialize → parse gives deep-equal project and identical exports", (name) => {
    const p1 = load(read(`${name}.project.json`));
    const saved = serialize(p1);
    const p2 = load(saved);
    expect(p2).toEqual(p1);
    expect(exportAll(p2)).toEqual(exportAll(p1));
  });

  test("a project with open decisions also round-trips (nulls kept)", () => {
    const p = clone(load(harbourText));
    p.visual.paletteVariant = null;
    p.resolved = null;
    const back = load(serialize(p));
    expect(back).toEqual(p);
  });

  test("store autosave → new store restores the same project and the same exports", () => {
    const storage = new MemStorage();
    const s1 = createProjectStore(storage, () => new Date("2026-10-01T10:00:00Z"));
    expect(s1.open(harbourText)).toEqual([]);
    const s2 = createProjectStore(storage);
    expect(s2.getState().project).toEqual(s1.getState().project);
    expect(exportAll(s2.getState().project)).toEqual(exportAll(s1.getState().project));
  });

  test("an invalid file leaves project, savedAt and localStorage untouched and lists every problem", () => {
    const storage = new MemStorage();
    const s = createProjectStore(storage, () => new Date("2026-10-01T10:00:00Z"));
    s.open(harbourText);
    const before = s.getState();
    const stored = storage.getItem(STORAGE_KEY);
    const errors = s.open(read("invalid-many.project.json"));
    expect(errors.length).toBe(8);
    expect(s.getState().project).toBe(before.project);
    expect(s.getState().savedAt).toBe(before.savedAt);
    expect(storage.getItem(STORAGE_KEY)).toBe(stored);
  });
});

describe("No silent defaults: the parser never coerces; missing is an error, null stays null", () => {
  const sub = (from: string, to: string) => {
    expect(harbourText).toContain(from);
    return harbourText.replace(from, to);
  };
  test.each([
    ['"radius": 8,', '"radius": "8",', "visual.radius:type"],
    ['"spacingBase": 4,', '"spacingBase": "4",', "visual.spacingBase:type"],
    ['"minRatio": 4.5', '"minRatio": "4,5"', "principles[2].params.minRatio:type"],
    ['"minRatio": 4.5', '"minRatio": "4.5"', "principles[2].params.minRatio:type"],
    ['"radius": 8,', '"radius": 8.5,', "visual.radius:not-integer"],
    ['"radius": 8,', '"radius": "",', "visual.radius:type"],
    ['"radius": 8,', '"radius": false,', "visual.radius:type"],
    ['"radius": 8,', '"radius": "NaN",', "visual.radius:type"],
    ['"radius": 8,', '"radius": "Infinity",', "visual.radius:type"],
    ['"radius": 8,', '"radius": 1e400,', "visual.radius:not-integer"],
    ['"minRatio": 4.5', '"minRatio": 1e400', "principles[2].params.minRatio:range"],
    ['"minPx": 44', '"minPx": "44px"', "principles[0].params.minPx:type"],
    ['"brandHex": "#0F766E",', '"brandHex": "0F766E",', "visual.brandHex:hex"],
    ['"brandHex": "#0F766E",', '"brandHex": "#0F766E80",', "visual.brandHex:hex"],
    ['"name": "Harbour",', '"name": "   ",', "profile.name:empty"],
    ['"name": "Harbour",', '"name": 42,', "profile.name:type"],
    ['"notes": "Booking tool for small physiotherapy clinics. Fictional sample project.",', '"notes": null,', "profile.notes:type"],
  ])("%s → %s is reported as %s", (from, to, expected) => {
    expect(codes(sub(from, to))).toContain(expected);
  });

  test("a missing key is reported, never defaulted to 0", () => {
    expect(codes(sub('    "radius": 8,\n', ""))).toContain("visual.radius:missing-key");
  });

  test("NaN / Infinity written as bare JSON tokens are a json-syntax error", () => {
    expect(codes(sub('"radius": 8,', '"radius": NaN,'))).toEqual([":json-syntax"]);
    expect(codes(sub('"radius": 8,', '"radius": Infinity,'))).toEqual([":json-syntax"]);
  });
});

describe("Messy input: hostile project files are reported, never crash, never silently accepted", () => {
  const h = () => JSON.parse(harbourText);
  test.each([
    ["empty file", ""],
    ["whitespace only", "  \n "],
    ["JSON null", "null"],
    ["JSON array", "[]"],
    ["a number", "42"],
    ["schemaVersion as text", harbourText.replace('"schemaVersion": 1', '"schemaVersion": "1"')],
    ["profile is a list", JSON.stringify({ ...h(), profile: [] })],
    ["visual is text", JSON.stringify({ ...h(), visual: "x" })],
    ["principles is an object", JSON.stringify({ ...h(), principles: {} })],
    ["resolved is a number", JSON.stringify({ ...h(), resolved: 7 })],
    ["resolved.color.light is a list", JSON.stringify({ ...h(), resolved: { ...h().resolved, color: { light: [], dark: null } } })],
    ["resolved.rules has an extra rule", JSON.stringify({ ...h(), resolved: { ...h().resolved, rules: [...h().resolved.rules, h().resolved.rules[0]] } })],
    ["principles item is null", JSON.stringify({ ...h(), principles: [null] })],
    ["extra root key", JSON.stringify({ ...h(), extra: 1 })],
    ["__proto__ key", harbourText.replace('"profile": {', '"__proto__": {"x": 1},\n  "profile": {')],
    ["colorOverrides with unknown role", JSON.stringify({ ...h(), visual: { ...h().visual, colorOverrides: { brand: "#000000" } } })],
    ["duplicate law", JSON.stringify({ ...h(), principles: [h().principles[0], h().principles[0]] })],
    ["deep nesting", `${"[".repeat(100000)}${"]".repeat(100000)}`],
  ])("%s → ok:false with at least one error and no throw", (_n, text) => {
    let r: ReturnType<typeof parse> | undefined;
    expect(() => { r = parse(text); }).not.toThrow();
    expect(r!.ok).toBe(false);
    if (!r!.ok) expect(r!.errors.length).toBeGreaterThan(0);
  });

  test("a 1 MB name is too-long and the error message stays short", () => {
    const big = "x".repeat(1_000_000);
    const r = parse(JSON.stringify({ ...h(), profile: { ...h().profile, name: big } }));
    expect(r.ok ? [] : r.errors.map((e) => `${e.path}:${e.code}`)).toEqual(["profile.name:too-long"]);
    if (!r.ok) expect(r.errors[0].message.length).toBeLessThan(500);
  });

  test("a 1 MB string in a numeric field: reported, and the message does not echo the whole value", () => {
    const big = "9".repeat(1_000_000);
    const r = parse(JSON.stringify({ ...h(), visual: { ...h().visual, radius: big } }));
    expect(r.ok ? [] : r.errors.map((e) => `${e.path}:${e.code}`)).toContain("visual.radius:type");
    if (!r.ok) for (const e of r.errors) expect(e.message.length, `${e.path} message length`).toBeLessThan(500);
  });

  test("a UTF-8 BOM at the start is reported (json-syntax), not a crash", () => {
    const r = parse(`﻿${harbourText}`);
    expect(r.ok ? [] : r.errors.map((e) => e.code)).toEqual(["json-syntax"]);
  });

  test("CRLF line endings parse to the same project, and serialize writes LF", () => {
    const crlf = harbourText.replace(/\n/g, "\r\n");
    const p = load(crlf);
    expect(p).toEqual(load(harbourText));
    expect(serialize(p)).toBe(harbourText);
  });

  test("json-syntax on a CRLF file still gives a line:col", () => {
    const r = parse(harbourText.replace(/\n/g, "\r\n").slice(0, 300));
    expect(r.ok ? [] : r.errors[0].message).toMatch(/line \d+:\d+/);
  });

  test("text values with a line break are reported or escaped in DESIGN.md (no heading injection)", () => {
    const p = clone(load(harbourText));
    p.profile.productType = "Booking\n## Colour";
    const r = parse(serialize(p));
    if (r.ok) {
      const md = exportAll(r.project)["DESIGN.md"];
      expect(md.split("\n").filter((l) => l === "## Colour")).toHaveLength(1);
    }
  });
});

describe("The two branches", () => {
  test("edge-no-shadcn: tokens.json equals harbour, DESIGN.md has the role CSS block and no shadcn names", () => {
    const h = exportAll(load(harbourText));
    const n = exportAll(load(read("edge-no-shadcn.project.json")));
    expect(n["tokens.json"]).toBe(h["tokens.json"]);
    expect(n["ux-rules.yaml"]).toBe(h["ux-rules.yaml"]);
    const md = n["DESIGN.md"];
    for (const v of ["--background", "--foreground", "--primary", "--ring", "--destructive", "shadcn/ui variables"]) expect(md).not.toContain(v);
    for (const role of ["--bg:", "--surface:", "--border:", "--text:", "--text-muted:", "--accent:", "--on-accent:", "--positive:", "--warning:", "--negative:", "--focus:", "--radius: 8px"]) {
      expect(md).toContain(role);
    }
    expect(md).toContain("--color-bg: var(--bg);");
  });

  test("edge-single-family: both font tokens name the same family with different weights; Loading lists it once", () => {
    const e = exportAll(load(read("edge-single-family.project.json")));
    const t = JSON.parse(e["tokens.json"]);
    expect(t.font.display.$value[0]).toBe(t.font.text.$value[0]);
    expect(t.font.display.$extensions).toBeDefined();
    expect(t.font.display.$extensions["com.github.mikkelstaehr.design-wizard"].weights).not.toEqual(
      t.font.text.$extensions["com.github.mikkelstaehr.design-wizard"].weights,
    );
    const loading = e["DESIGN.md"].split("\n").find((l) => l.startsWith("- **Loading:**"))!;
    expect(loading.match(/@fontsource\//g)).toHaveLength(1);
  });
});
