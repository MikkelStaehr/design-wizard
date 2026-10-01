"use client";
import type { Visual } from "@/contracts/project";
import { STEPS, type StepId, type VisualKey } from "@/domain/decisions";
import { ShortcutLegend } from "./ShortcutLegend";
import { SubDecisionList } from "./SubDecisionList";
import { isDecided, SUB_KEYS } from "./steps/visual/model";

export function Rail({
  current,
  productName,
  visual,
  sub,
  onPick,
}: {
  current: StepId;
  productName: string | null;
  visual: Visual;
  sub: VisualKey;
  onPick: (key: VisualKey) => void;
}) {
  const decided = SUB_KEYS.filter((k) => isDecided(visual, k)).length;
  return (
    <nav aria-label="Wizard steps" className="flex h-full flex-col gap-3.5 border-r border-dw-line px-3 py-4">
      <p className="flex items-center gap-2 px-1 font-mono text-small font-medium tracking-[0.04em] uppercase">
        <span aria-hidden="true" className="inline-block size-3 border-[1.5px] border-dw-text" />
        Design Wizard{productName ? ` · ${productName}` : ""}
      </p>
      <ol className="flex flex-col">
        {STEPS.map((step) => {
          const isCurrent = step.id === current;
          const built = step.id === "visual";
          return (
            <li
              key={step.id}
              aria-current={isCurrent ? "step" : undefined}
              className={`grid min-h-11 grid-cols-[22px_1fr] items-start gap-1.5 border-t border-dw-line py-2.5 pr-1 ${
                isCurrent ? "border-l-2 border-l-dw-accent pl-2" : "pl-1"
              }`}
            >
              <span className="font-mono text-label leading-5 text-dw-text-muted tabular-nums">{String(step.number).padStart(2, "0")}</span>
              <span className="flex min-w-0 flex-col">
                <span className="font-medium">{step.title}</span>
                <span className="text-small text-dw-text-muted">
                  {built ? `${decided} of ${SUB_KEYS.length} decided` : "Not built yet"}
                </span>
                {step.id === "visual" && (
                  <span className="mt-1.5 -ml-1.5 block">
                    <SubDecisionList visual={visual} current={sub} onPick={onPick} />
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      <ShortcutLegend className="mt-auto pt-6" />
    </nav>
  );
}
