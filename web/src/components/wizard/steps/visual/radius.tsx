"use client";
import { numericCandidates, VISUAL_CANDIDATES } from "@/domain/decisions";
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
  const fixed: readonly number[] = VISUAL_CANDIDATES.radius;
  // A saved value outside the fixed candidates replaces the nearest one, so the user's choice is always on screen.
  const options = numericCandidates("radius", visual.radius).map((n) => ({
    id: String(n),
    label: radiusLabel(n),
    description: fixed.includes(n) ? (DESCRIPTIONS[n] ?? `Corner radius ${n}px.`) : `Corner radius ${n}px, from your file.`,
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
