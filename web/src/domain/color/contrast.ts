// Owner of WCAG 2.x luminance, contrast ratio, the PASS rule and ratio formatting.
// Used by the contrast table, the palette, the DESIGN.md exporter and contract test C4.
import type { Hex } from "@/contracts/project";
import { hexToRgb } from "./hex";

function linear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: Hex): number {
  const [r, g, b] = hexToRgb(hex).map(linear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Unrounded ratio, 1–21. PASS is always decided on this value. */
export function contrastRatio(a: Hex, b: Hex): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function passes(ratio: number, min: number): boolean {
  return ratio >= min;
}

/** Floored to 2 decimals, so a failing value can never display as a pass: 4.478 → "4.47". */
export function formatRatio(ratio: number): string {
  return (Math.floor(ratio * 100 + 1e-9) / 100).toFixed(2);
}
