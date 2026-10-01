"use client";
import { VISUAL_CANDIDATES } from "@/domain/decisions";
import { PREVIEW_NEUTRALS, resolveForPlate } from "@/domain/tokens/resolve";
import { PlateGrid } from "@/components/plate/PlateGrid";
import { fontPairLabel, spacingLabel, type DecisionProps } from "./model";

export function SpacingDecision({ visual, productName, onChoose }: DecisionProps) {
  const fontPairId = visual.fontPair ?? PREVIEW_NEUTRALS.fontPair;
  const options = VISUAL_CANDIDATES.spacingBase.map((n) => ({
    id: String(n),
    label: spacingLabel(n),
    description: `Every gap and padding is a multiple of ${n}px.`,
    tokens: resolveForPlate(visual, { spacingBase: n }),
    fontPairId,
    fontLabel: fontPairLabel(fontPairId),
  }));
  const chosen = visual.spacingBase === null ? null : String(visual.spacingBase);
  return (
    <PlateGrid
      key={`spacing:${chosen}`}
      label="Spacing variants"
      decision="spacing"
      options={options}
      chosenId={chosen}
      productName={productName}
      onChoose={(id) => onChoose("spacingBase", Number(id))}
    />
  );
}
