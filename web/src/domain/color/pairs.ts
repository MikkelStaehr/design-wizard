// Owner of which colour pairs are checked and against which minimum (docs/CONTRACTS.md §4.3).
import type { ColorRole, Hex } from "@/contracts/project";
import { contrastRatio, passes } from "./contrast";

export interface ContrastPair {
  fg: ColorRole;
  bg: ColorRole;
  /** 4.5 for text, 3 for non-text. */
  min: number;
}

export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  { fg: "text", bg: "bg", min: 4.5 },
  { fg: "text", bg: "surface", min: 4.5 },
  { fg: "text-muted", bg: "bg", min: 4.5 },
  { fg: "text-muted", bg: "surface", min: 4.5 },
  { fg: "on-accent", bg: "accent", min: 4.5 },
  { fg: "accent", bg: "bg", min: 4.5 },
  { fg: "positive", bg: "bg", min: 4.5 },
  { fg: "warning", bg: "bg", min: 4.5 },
  { fg: "negative", bg: "bg", min: 4.5 },
  { fg: "border", bg: "bg", min: 3 },
  { fg: "border", bg: "surface", min: 3 },
  { fg: "focus", bg: "bg", min: 3 },
];

export interface PairResult extends ContrastPair {
  ratio: number;
  pass: boolean;
}

export function checkPairs(colors: Record<ColorRole, Hex>): PairResult[] {
  return CONTRAST_PAIRS.map((p) => {
    const ratio = contrastRatio(colors[p.fg], colors[p.bg]);
    return { ...p, ratio, pass: passes(ratio, p.min) };
  });
}
