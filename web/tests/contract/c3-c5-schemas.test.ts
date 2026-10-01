// C3 tokens.json, C4 DESIGN.md CSS + contrast, C5 ux-rules.yaml (docs/CONTRACTS.md §7).
import Ajv2020 from "ajv/dist/2020";
import { describe, expect, test } from "vitest";
import { parse as parseYaml } from "yaml";
import { COLOR_ROLES, FONT_SIZE_KEYS, SPACE_KEYS } from "@/contracts/project";
import { CHECK_PARAMS, type CheckKind } from "@/contracts/rules";
import tokensSchema from "@/contracts/schemas/tokens.v1.schema.json";
import uxSchema from "@/contracts/schemas/ux-rules.v1.schema.json";
import { contrastRatio, formatRatio } from "@/domain/color/contrast";
import { roleCss } from "@/export/css-vars";
import { shadcnCss } from "@/export/shadcn-map";
import type { Tokens } from "@/export/tokens-json";
import { readGolden, validFixtures } from "./fixtures";

// strictRequired is off only because `required` inside if/then names a property declared one level up (valid JSON Schema).
const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
const validateTokens = ajv.compile(tokensSchema);
const validateUx = ajv.compile(uxSchema);
const fixtures = validFixtures();

/** Leaf token paths (objects with $value), skipping $-prefixed properties. */
function tokenPaths(node: Record<string, unknown>, prefix = ""): string[] {
  if ("$value" in node) return [prefix];
  return Object.entries(node)
    .filter(([k]) => !k.startsWith("$"))
    .flatMap(([k, v]) => tokenPaths(v as Record<string, unknown>, prefix ? `${prefix}.${k}` : k));
}

function resolveAlias(tokens: Record<string, unknown>, ref: string): unknown {
  return ref.split(".").reduce<unknown>((n, k) => (n as Record<string, unknown> | undefined)?.[k], tokens);
}

const EXPECTED_PATHS = [
  ...COLOR_ROLES.map((r) => `color.${r}`),
  "font.display",
  "font.text",
  ...FONT_SIZE_KEYS.map((k) => `font-size.${k}`),
  "line-height.text",
  "line-height.display",
  "radius.base",
  ...SPACE_KEYS.map((k) => `space.${k}`),
];

describe.each(fixtures)("$name", ({ name, project }) => {
  test("C3: tokens.json passes its schema, aliases resolve, every token appears exactly once", () => {
    const text = readGolden(name, "tokens.json");
    const tokens = JSON.parse(text);
    expect(validateTokens(tokens), JSON.stringify(validateTokens.errors)).toBe(true);
    for (const [, ref] of text.matchAll(/"\{([^}]+)\}"/g)) expect(resolveAlias(tokens, ref)).toBeDefined();
    expect(tokenPaths(tokens).sort()).toEqual([...EXPECTED_PATHS].sort());
  });

  test("C4: the CSS block is the mapping of tokens.json and the contrast rows recompute", () => {
    const tokens: Tokens = JSON.parse(readGolden(name, "tokens.json"));
    const md = readGolden(name, "DESIGN.md");
    const css = /```css\n([\s\S]*?)\n```/.exec(md)?.[1];
    const expected = project.profile.componentLibrary === "shadcn" ? shadcnCss(tokens) : roleCss(tokens);
    expect(css).toBe(expected);

    const rows = [...md.matchAll(/^\| ([a-z-]+) \/ ([a-z-]+) \| (\d+\.\d\d) : 1 \| ≥ ([\d.]+) \| (PASS|FAIL) \|$/gm)];
    expect(rows.length).toBe(12);
    for (const [, fg, bg, shown, min, result] of rows) {
      const ratio = contrastRatio(tokens.color[fg].$value.hex, tokens.color[bg].$value.hex);
      expect(shown, `${fg}/${bg}`).toBe(formatRatio(ratio));
      expect(result).toBe(ratio >= Number(min) ? "PASS" : "FAIL");
    }
  });

  test("C5: ux-rules.yaml passes its schema with params matching each kind", () => {
    const doc = parseYaml(readGolden(name, "ux-rules.yaml"));
    expect(validateUx(doc), JSON.stringify(validateUx.errors)).toBe(true);
    const ids = doc.rules.map((r: { id: string }) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const rule of doc.rules as { check: { kind: CheckKind; selector: string | null; params: object; question?: string } }[]) {
      expect(Object.keys(rule.check.params)).toEqual(CHECK_PARAMS[rule.check.kind]);
      if (rule.check.kind === "manual") expect(rule.check.question).toBeTruthy();
      else expect(rule.check.selector).toBeTruthy();
    }
  });
});

test("the schemas reject broken files", () => {
  const tokens = JSON.parse(readGolden("harbour", "tokens.json"));
  delete tokens.color["on-accent"];
  tokens.radius.base.$value.unit = "rem";
  expect(validateTokens(tokens)).toBe(false);

  const doc = parseYaml(readGolden("harbour", "ux-rules.yaml"));
  const manual = doc.rules.find((r: { check: { kind: string } }) => r.check.kind === "manual");
  delete manual.check.question;
  doc.rules[0].id = "no-dot";
  expect(validateUx(doc)).toBe(false);
  expect((validateUx.errors ?? []).length).toBeGreaterThanOrEqual(2);
});

test("C4 anchors: contrast.ts holds its hand-computed values", () => {
  expect(formatRatio(contrastRatio("#000000", "#FFFFFF"))).toBe("21.00");
  expect(formatRatio(contrastRatio("#777777", "#FFFFFF"))).toBe("4.47");
});
