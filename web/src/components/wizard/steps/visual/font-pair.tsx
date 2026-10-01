"use client";
import { useState } from "react";
import { FONT_PAIRS } from "@/content/font-pairs";
import { resolveForPlate } from "@/domain/tokens/resolve";
import { PlateGrid } from "@/components/plate/PlateGrid";
import { fontPairLabel, type DecisionProps } from "./model";

const PAGE = 3;

/** Catalogue pairs, three at a time; "More pairs" pages through the rest. */
export function FontPairDecision({ visual, productName, onChoose }: DecisionProps) {
  const pages = Math.max(1, Math.ceil(FONT_PAIRS.length / PAGE));
  const chosenIndex = visual.fontPair === null ? -1 : FONT_PAIRS.findIndex((p) => p.id === visual.fontPair);
  const [page, setPage] = useState(chosenIndex < 0 ? 0 : Math.floor(chosenIndex / PAGE));
  const shown = FONT_PAIRS.slice(page * PAGE, page * PAGE + PAGE);
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
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-3">
          <span className="font-mono text-label text-dw-text-muted tabular-nums">
            Pairs {page * PAGE + 1}–{page * PAGE + shown.length} of {FONT_PAIRS.length}
          </span>
          <button
            type="button"
            onClick={() => setPage((page + 1) % pages)}
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
      />
    </>
  );
}
