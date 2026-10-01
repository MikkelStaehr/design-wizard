"use client";
import type { Density } from "@/contracts/project";
import { VISUAL_CANDIDATES } from "@/domain/decisions";
import { PREVIEW_NEUTRALS, resolveForPlate } from "@/domain/tokens/resolve";
import { PlateGrid } from "@/components/plate/PlateGrid";
import { densityLabel, fontPairLabel, type DecisionProps } from "./model";

const DESCRIPTIONS: Record<Density, string> = {
  compact: "Smaller type and tighter lines; more on screen.",
  balanced: "A middle ground for most screens.",
  airy: "Larger type and more line-height; calmer reading.",
};

export function DensityDecision({ visual, productName, onChoose }: DecisionProps) {
  const fontPairId = visual.fontPair ?? PREVIEW_NEUTRALS.fontPair;
  const options = VISUAL_CANDIDATES.density.map((d) => ({
    id: d,
    label: densityLabel(d),
    description: DESCRIPTIONS[d],
    tokens: resolveForPlate(visual, { density: d }),
    fontPairId,
    fontLabel: fontPairLabel(fontPairId),
  }));
  return (
    <PlateGrid
      key={`density:${visual.density}`}
      label="Density variants"
      decision="density"
      options={options}
      chosenId={visual.density}
      productName={productName}
      onChoose={(id) => onChoose("density", id as Density)}
    />
  );
}
