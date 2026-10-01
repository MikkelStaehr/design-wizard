"use client";
import { VISUAL_CANDIDATES } from "@/domain/decisions";
import { PREVIEW_NEUTRALS, resolveForPlate } from "@/domain/tokens/resolve";
import { PlateGrid } from "@/components/plate/PlateGrid";
import { fontPairLabel, radiusLabel, type DecisionProps } from "./model";

const DESCRIPTIONS: Record<number, string> = {
  0: "Square corners everywhere.",
  6: "Softened corners on controls and cards.",
  14: "Round, friendly corners.",
};

export function RadiusDecision({ visual, productName, onChoose }: DecisionProps) {
  const fontPairId = visual.fontPair ?? PREVIEW_NEUTRALS.fontPair;
  const options = VISUAL_CANDIDATES.radius.map((n) => ({
    id: String(n),
    label: radiusLabel(n),
    description: DESCRIPTIONS[n] ?? `Corner radius ${n}px.`,
    tokens: resolveForPlate(visual, { radius: n }),
    fontPairId,
    fontLabel: fontPairLabel(fontPairId),
  }));
  const chosen = visual.radius === null ? null : String(visual.radius);
  return (
    <PlateGrid
      key={`radius:${chosen}`}
      label="Radius variants"
      decision="radius"
      options={options}
      chosenId={chosen}
      productName={productName}
      onChoose={(id) => onChoose("radius", Number(id))}
    />
  );
}
