// Owner of brand colour → palettes (docs/ARCHITECTURE.md §4). v0.1 offers only palettes where
// every checked pair passes AA ("Apply fix" is cut): each role starts at a target lightness and
// moves only as far as it must to pass its pairs. The ids and labels of the variants live here.
import type { ColorRole, Hex, PaletteVariant } from "@/contracts/project";
import { contrastRatio } from "./contrast";
import { hexToOklch, oklchToHex, type Oklch } from "./oklch";
import { checkPairs } from "./pairs";

export const PALETTE_LABELS: Record<PaletteVariant, { label: string; description: string }> = {
  quiet: { label: "Quiet", description: "Neutral greys; the brand colour only on actions." },
  tinted: { label: "Tinted", description: "Neutrals tinted toward the brand colour." },
  deep: { label: "Deep", description: "Dark surfaces in the brand colour." },
};

const WHITE = "#FFFFFF";
const BLACK = "#000000";
const STEP = 0.005;

/** Moves lightness from `start` toward `dir` (−1 darker, +1 lighter) until `ok` holds. */
function fit(start: Oklch, dir: -1 | 1, ok: (hex: Hex) => boolean): Hex {
  for (let l = start.l; l >= 0 && l <= 1; l += dir * STEP) {
    const hex = oklchToHex({ ...start, l });
    if (ok(hex)) return hex;
  }
  return dir < 0 ? BLACK : WHITE;
}

const passesAll = (against: Hex[], min: number) => (hex: Hex) => against.every((b) => contrastRatio(hex, b) >= min);

/** The brand as the accent if it already passes; otherwise the nearest lightness that does. */
function accentFor(brand: Hex, bg: Hex, onAccent: Hex, dir: -1 | 1): Hex {
  const ok = (hex: Hex) => contrastRatio(hex, bg) >= 4.5 && contrastRatio(onAccent, hex) >= 4.5;
  return ok(brand) ? brand : fit(hexToOklch(brand), dir, ok);
}

function lightPalette(brand: Hex, tint: number): Record<ColorRole, Hex> {
  const { c: bc, h } = hexToOklch(brand);
  const tc = (max: number) => Math.min(max, bc) * tint;
  const bg = oklchToHex({ l: tint > 0 ? 0.972 : 0.985, c: tc(0.02), h });
  const surface = WHITE;
  const text = fit({ l: 0.24, c: tc(0.04), h }, -1, passesAll([bg, surface], 7));
  const muted = fit({ l: 0.52, c: tc(0.04), h }, -1, passesAll([bg, surface], 4.5));
  const border = fit({ l: 0.64, c: tc(0.05), h }, -1, passesAll([bg, surface], 3));
  const accent = accentFor(brand, bg, WHITE, -1);
  const status = (l: number, c: number, hue: number) => fit({ l, c, h: hue }, -1, passesAll([bg], 4.5));
  return {
    bg, surface, border, text, "text-muted": muted, accent, "on-accent": WHITE,
    positive: status(0.52, 0.13, 150), warning: status(0.56, 0.13, 65), negative: status(0.53, 0.19, 27), focus: accent,
  };
}

function deepPalette(brand: Hex): Record<ColorRole, Hex> {
  const { c: bc, h } = hexToOklch(brand);
  const tc = (max: number) => Math.min(max, bc);
  const bg = oklchToHex({ l: 0.22, c: tc(0.05), h });
  const surface = oklchToHex({ l: 0.27, c: tc(0.05), h });
  const text = fit({ l: 0.95, c: tc(0.02), h }, 1, passesAll([bg, surface], 7));
  const muted = fit({ l: 0.78, c: tc(0.03), h }, 1, passesAll([bg, surface], 4.5));
  const border = fit({ l: 0.55, c: tc(0.04), h }, 1, passesAll([bg, surface], 3));
  const onAccent = oklchToHex({ l: 0.17, c: tc(0.03), h });
  const accent = accentFor(brand, bg, onAccent, 1);
  const status = (l: number, c: number, hue: number) => fit({ l, c, h: hue }, 1, passesAll([bg], 4.5));
  return {
    bg, surface, border, text, "text-muted": muted, accent, "on-accent": onAccent,
    positive: status(0.8, 0.13, 150), warning: status(0.84, 0.12, 85), negative: status(0.74, 0.13, 25), focus: accent,
  };
}

/** One palette, or null if it cannot pass every pair (then it is not offered). */
export function palette(brand: Hex, variant: PaletteVariant): Record<ColorRole, Hex> | null {
  const colors = variant === "quiet" ? lightPalette(brand, 0) : variant === "tinted" ? lightPalette(brand, 1) : deepPalette(brand);
  return checkPairs(colors).every((p) => p.pass) ? colors : null;
}

/** The palettes offered for a brand colour, in variant order. */
export function palettes(brand: Hex): { variant: PaletteVariant; colors: Record<ColorRole, Hex> }[] {
  return (["quiet", "tinted", "deep"] as const).flatMap((variant) => {
    const colors = palette(brand, variant);
    return colors ? [{ variant, colors }] : [];
  });
}
