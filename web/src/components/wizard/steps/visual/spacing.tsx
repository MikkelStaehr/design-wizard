"use client";
import { numericCandidates, VISUAL_CANDIDATES } from "@/domain/decisions";
import { PREVIEW_NEUTRALS, resolveForPlate } from "@/domain/tokens/resolve";
import { PlateGrid } from "@/components/plate/PlateGrid";
import { fontPairLabel, spacingLabel, type DecisionProps } from "./model";

export function SpacingDecision({ visual, productName, onChoose }: DecisionProps) {
  const fontPairId = visual.fontPair ?? PREVIEW_NEUTRALS.fontPair;
  const fixed: readonly number[] = VISUAL_CANDIDATES.spacingBase;
  // A saved value outside the fixed candidates replaces the nearest one, so the user's choice is always on screen.
  const options = numericCandidates("spacingBase", visual.spacingBase).map((n) => ({
    id: String(n),
    label: spacingLabel(n),
    description: fixed.includes(n) ? `Every gap and padding is a multiple of ${n}px.` : `Spacing base ${n}px, from your file.`,
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
      preview={(id) => ({ key: "spacingBase", value: Number(id) })}
    />
  );
}
