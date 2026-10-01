// View helpers for step 3: which sub-decisions are open, and how a chosen value reads in the rail.
import type { Visual } from "@/contracts/project";
import { FONT_BY_ID } from "@/content/fonts";
import { FONT_PAIR_BY_ID } from "@/content/font-pairs";
import { PALETTE_LABELS } from "@/domain/color/palette";
import { VISUAL_SUBDECISIONS, type VisualKey } from "@/domain/decisions";

export const SUB_KEYS: readonly VisualKey[] = VISUAL_SUBDECISIONS.map((s) => s.key);

/** "Sora + Inter", or "Inter" for a single-family pair. Unknown ids are shown as-is, never hidden. */
export function fontPairLabel(id: string): string {
  const pair = FONT_PAIR_BY_ID.get(id);
  if (!pair) return id;
  const display = FONT_BY_ID.get(pair.display.font)?.family ?? pair.display.font;
  const text = FONT_BY_ID.get(pair.text.font)?.family ?? pair.text.font;
  return display === text ? display : `${display} + ${text}`;
}

export const spacingLabel = (n: number) => `${n}-pt`;
export const radiusLabel = (n: number) => `${n} px`;
export const densityLabel = (d: string) => d.charAt(0).toUpperCase() + d.slice(1);

/** The palette sub-decision needs both the brand colour and a variant. */
export function isDecided(v: Visual, key: VisualKey): boolean {
  return key === "paletteVariant" ? v.paletteVariant !== null && v.brandHex !== null : v[key] !== null;
}

/** The chosen value as shown in the rail, or null while open. */
export function valueLabel(v: Visual, key: VisualKey): string | null {
  if (!isDecided(v, key)) return null;
  switch (key) {
    case "fontPair":
      return fontPairLabel(v.fontPair as string);
    case "spacingBase":
      return spacingLabel(v.spacingBase as number);
    case "radius":
      return radiusLabel(v.radius as number);
    case "paletteVariant":
      return PALETTE_LABELS[v.paletteVariant as NonNullable<Visual["paletteVariant"]>].label;
    case "density":
      return densityLabel(v.density as string);
  }
}

export function firstOpen(v: Visual): VisualKey | null {
  return SUB_KEYS.find((k) => !isDecided(v, k)) ?? null;
}

/** The next open sub-decision after `from`, wrapping around; null when every other one is decided. */
export function nextOpenAfter(v: Visual, from: VisualKey): VisualKey | null {
  const i = SUB_KEYS.indexOf(from);
  for (let n = 1; n < SUB_KEYS.length; n++) {
    const k = SUB_KEYS[(i + n) % SUB_KEYS.length];
    if (!isDecided(v, k)) return k;
  }
  return null;
}

/** E: the nearest decided sub-decision before `from`, else the last decided one. */
export function lastDecidedBefore(v: Visual, from: VisualKey): VisualKey | null {
  const i = SUB_KEYS.indexOf(from);
  for (let n = i - 1; n >= 0; n--) if (isDecided(v, SUB_KEYS[n])) return SUB_KEYS[n];
  for (let n = SUB_KEYS.length - 1; n > i; n--) if (isDecided(v, SUB_KEYS[n])) return SUB_KEYS[n];
  return null;
}

/** Props every sub-decision view takes. `onChoose` records the value through the store, then moves on. */
export interface DecisionProps {
  visual: Visual;
  productName: string | null;
  onChoose: <K extends VisualKey>(key: K, value: NonNullable<Visual[K]>) => void;
}
