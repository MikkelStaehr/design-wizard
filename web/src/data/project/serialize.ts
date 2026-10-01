// ProjectFile → canonical bytes. Objects are rebuilt in contract key order (docs/CONTRACTS.md §0),
// so the bytes never depend on how a file was parsed or edited.
import { COLOR_ROLES, FONT_SIZE_KEYS, SPACE_KEYS, type FontRef, type ProjectFile, type Resolved } from "@/contracts/project";
import type { Rule } from "@/contracts/rules";
import { LAW_BY_ID } from "@/content/laws";
import { stableJson } from "@/lib/stable-json";

function byKeys<T extends string, V>(keys: readonly T[], source: Partial<Record<T, V>>): Record<T, V> {
  const out = {} as Record<T, V>;
  for (const k of keys) if (source[k] !== undefined) out[k] = source[k] as V;
  return out;
}

function lawParams(lawId: string, params: Record<string, number>): Record<string, number> {
  const order = LAW_BY_ID.get(lawId)?.params.map((p) => p.key) ?? Object.keys(params);
  return byKeys(order, params);
}

function fontRef(f: FontRef): FontRef {
  const { catalogueId, family, generic, fontsource, subset, weights, style, license, copyright } = f;
  return { catalogueId, family, generic, fontsource, subset, weights: [...weights], style, license, copyright };
}

export function canonicalRule(r: Rule): Rule {
  const { kind, selector, params, viewports, question } = r.check;
  return {
    id: r.id,
    law: r.law,
    when: r.when,
    rule: r.rule,
    severity: r.severity,
    check: {
      kind,
      selector,
      params: lawParams(r.law, params),
      viewports: [...viewports],
      ...(kind === "manual" ? { question } : {}),
    },
  };
}

function resolved(r: Resolved): Resolved {
  return {
    color: { light: byKeys(COLOR_ROLES, r.color.light), dark: null },
    font: { display: fontRef(r.font.display), text: fontRef(r.font.text) },
    fontSize: byKeys(FONT_SIZE_KEYS, r.fontSize),
    lineHeight: { text: r.lineHeight.text, display: r.lineHeight.display },
    space: byKeys(SPACE_KEYS, r.space),
    radius: r.radius,
    rules: r.rules.map(canonicalRule),
  };
}

export function canonical(p: ProjectFile): ProjectFile {
  const { name, productType, platform, notes, componentLibrary } = p.profile;
  const v = p.visual;
  return {
    schemaVersion: p.schemaVersion,
    format: p.format,
    profile: { name, productType, platform, notes, componentLibrary },
    principles: p.principles === null ? null : p.principles.map((x) => ({ lawId: x.lawId, params: lawParams(x.lawId, x.params) })),
    visual: {
      fontPair: v.fontPair,
      spacingBase: v.spacingBase,
      radius: v.radius,
      density: v.density,
      brandHex: v.brandHex,
      paletteVariant: v.paletteVariant,
      colorOverrides: byKeys(COLOR_ROLES, v.colorOverrides),
    },
    resolved: p.resolved === null ? null : resolved(p.resolved),
  };
}

export function serialize(p: ProjectFile): string {
  return stableJson(canonical(p));
}
