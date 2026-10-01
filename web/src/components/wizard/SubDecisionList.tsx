"use client";
import type { Visual } from "@/contracts/project";
import { VISUAL_SUBDECISIONS, type VisualKey } from "@/domain/decisions";
import { ArrowText } from "./ArrowText";
import { firstOpen, isDecided, nextOpenAfter, valueLabel } from "./steps/visual/model";

/** Step 3's sub-decisions with their state: the chosen value, "now", "next" or "open". Rows are 44px buttons. */
export function SubDecisionList({ visual, current, onPick }: { visual: Visual; current: VisualKey; onPick: (key: VisualKey) => void }) {
  const next = isDecided(visual, current) ? firstOpen(visual) : nextOpenAfter(visual, current);
  return (
    <ul className="flex flex-col">
      {VISUAL_SUBDECISIONS.map((s) => {
        const isCurrent = s.key === current;
        const value = valueLabel(visual, s.key);
        const state = value ?? (isCurrent ? "now" : s.key === next ? "next" : "open");
        return (
          <li key={s.key}>
            <button
              type="button"
              onClick={() => onPick(s.key)}
              aria-current={isCurrent ? "true" : undefined}
              className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-sm px-1.5 text-left text-small transition-colors duration-[120ms] ease-out ${
                isCurrent ? "bg-dw-surface font-medium text-dw-text outline outline-1 -outline-offset-1 outline-dw-ctl" : "text-dw-text-muted hover:bg-[var(--dw-hover)]"
              }`}
            >
              <span>
                <ArrowText text={s.label} />
              </span>
              <span className={`font-mono text-label font-normal ${isCurrent ? "text-dw-text" : ""}`}>{state}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
