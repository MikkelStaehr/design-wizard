"use client";
import { useState } from "react";
import { FONT_PAIRS } from "@/content/font-pairs";
import { evenPages } from "@/domain/decisions";
import { resolveForPlate } from "@/domain/tokens/resolve";
import { PlateGrid } from "@/components/plate/PlateGrid";
import { fontPairLabel, type DecisionProps } from "./model";

/** Catalogue pairs on even pages of 2–3 (7 → 3, 2, 2); "More pairs" pages through them. */
export function FontPairDecision({ visual, productName, onChoose }: DecisionProps) {
  const pages = evenPages(FONT_PAIRS.length);
  const chosenIndex = visual.fontPair === null ? -1 : FONT_PAIRS.findIndex((p) => p.id === visual.fontPair);
  const [page, setPage] = useState(chosenIndex < 0 ? 0 : pages.findIndex(([a, b]) => chosenIndex >= a && chosenIndex < b));
  const [start, end] = pages[page];
  const shown = FONT_PAIRS.slice(start, end);
  const options = shown.map((p) => ({
    id: p.id,
    label: fontPairLabel(p.id),
    description: p.note,
    tokens: resolveForPlate(visual, { fontPair: p.id }),
    fontPairId: p.id,
    fontLabel: fontPairLabel(p.id),
  }));
  return (
    <>
      {pages.length > 1 && (
        <div className="mt-4 flex items-center justify-end gap-3">
          <span className="font-mono text-label text-dw-text-muted tabular-nums">
            Pairs {start + 1}–{end} of {FONT_PAIRS.length}
          </span>
          <button
            type="button"
            onClick={() => setPage((page + 1) % pages.length)}
            className="min-h-11 rounded-sm border border-dw-ctl bg-dw-surface px-3 font-medium"
          >
            More pairs
          </button>
        </div>
      )}
      <PlateGrid
        key={`fontPair:${page}:${visual.fontPair}`}
        label="Font pair variants"
        decision="font pair"
        options={options}
        chosenId={visual.fontPair}
        productName={productName}
        onChoose={(id) => onChoose("fontPair", id)}
        preview={(id) => ({ key: "fontPair", value: id })}
      />
    </>
  );
}
