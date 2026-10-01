// Owner of decisions → `resolved` (stored snapshot) and decisions + candidate → plate tokens.
import type { ColorRole, FontRef, Hex, ProjectFile, Resolved, Visual } from "@/contracts/project";
import { FONT_PAIR_BY_ID, FONT_PAIRS } from "@/content/font-pairs";
import { FONT_BY_ID } from "@/content/fonts";
import { LAW_BY_ID } from "@/content/laws";
import { palette } from "../color/palette";
import { openDecisions } from "../decisions";
import { renderRule } from "../rules";
import { spaceScale, typeScale } from "./scales";

export type VisualDecisions = Omit<Visual, "colorOverrides">;
export type PlateTokens = Omit<Resolved, "rules">;

/**
 * Preview-only stand-ins for visual decisions that are still open, so a plate can render.
 * Never stored and never exported: export is blocked while any decision is open.
 */
export const PREVIEW_NEUTRALS: Required<{ [K in keyof VisualDecisions]: NonNullable<VisualDecisions[K]> }> = {
  fontPair: FONT_PAIR_BY_ID.has("inter-solo") ? "inter-solo" : FONT_PAIRS[0].id,
  spacingBase: 4,
  radius: 4,
  density: "balanced",
  brandHex: "#6B6B6B",
  paletteVariant: "quiet",
};

export function fontRef(catalogueId: string, weights: number[]): FontRef {
  const f = FONT_BY_ID.get(catalogueId);
  if (!f) throw new Error(`Unknown font "${catalogueId}"`);
  return {
    catalogueId: f.id, family: f.family, generic: f.generic, fontsource: f.fontsource, subset: f.subset,
    weights: [...weights], style: "normal", license: f.license, copyright: f.copyright,
  };
}

function colorsFor(brandHex: Hex, variant: VisualDecisions["paletteVariant"] & string, overrides: Visual["colorOverrides"]) {
  const base = palette(brandHex, variant) ?? palette(PREVIEW_NEUTRALS.brandHex, "quiet");
  if (!base) throw new Error("The neutral preview palette must always pass");
  return { ...base, ...overrides } as Record<ColorRole, Hex>;
}

function tokens(v: Required<{ [K in keyof VisualDecisions]: NonNullable<VisualDecisions[K]> }>, overrides: Visual["colorOverrides"]): PlateTokens {
  const pair = FONT_PAIR_BY_ID.get(v.fontPair);
  if (!pair) throw new Error(`Unknown font pair "${v.fontPair}"`);
  return {
    color: { light: colorsFor(v.brandHex, v.paletteVariant, overrides), dark: null },
    font: { display: fontRef(pair.display.font, pair.display.weights), text: fontRef(pair.text.font, pair.text.weights) },
    ...typeScale(v.density),
    space: spaceScale(v.spacingBase),
    radius: v.radius,
  };
}

/** Tokens for one plate: the decisions made so far, the candidate on top, neutrals for the rest. */
export function resolveForPlate(visual: Visual, candidate: Partial<VisualDecisions>): PlateTokens {
  const merged = { ...PREVIEW_NEUTRALS } as Required<{ [K in keyof VisualDecisions]: NonNullable<VisualDecisions[K]> }>;
  for (const key of Object.keys(PREVIEW_NEUTRALS) as (keyof VisualDecisions)[]) {
    const value = key in candidate ? candidate[key] : visual[key];
    if (value !== null && value !== undefined) (merged as Record<string, unknown>)[key] = value;
  }
  return tokens(merged, visual.colorOverrides);
}

/** The stored snapshot, or null while any decision is open. */
export function resolveSnapshot(p: ProjectFile): Resolved | null {
  if (openDecisions(p).length > 0 || p.principles === null) return null;
  const v = p.visual as Required<{ [K in keyof VisualDecisions]: NonNullable<VisualDecisions[K]> }> & Visual;
  // A palette that can't pass for this brand colour is an open decision, never a grey stand-in.
  if (palette(v.brandHex, v.paletteVariant) === null) return null;
  const rules = p.principles.map((pr) => {
    const law = LAW_BY_ID.get(pr.lawId);
    if (!law) throw new Error(`Unknown law "${pr.lawId}"`);
    return renderRule(law, pr.params);
  });
  return { ...tokens(v, v.colorOverrides), rules };
}
