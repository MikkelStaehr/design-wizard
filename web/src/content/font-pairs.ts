import type { FontPairEntry } from "@/contracts/content";

// SEED pairs for the slice 1 contract fixtures. Each weight must exist in that font's files.
export const FONT_PAIRS: readonly FontPairEntry[] = [
  {
    id: "sora-inter",
    display: { font: "sora", weights: [600, 700] },
    text: { font: "inter", weights: [400, 500, 600] },
    note: "A geometric display face over a neutral text face.",
  },
  {
    id: "inter-solo",
    display: { font: "inter", weights: [600] },
    text: { font: "inter", weights: [400, 500] },
    note: "One family; hierarchy comes from weight alone.",
  },
];

export const FONT_PAIR_BY_ID: ReadonlyMap<string, FontPairEntry> = new Map(FONT_PAIRS.map((p) => [p.id, p]));
