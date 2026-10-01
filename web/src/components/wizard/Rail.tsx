"use client";
import type { ProjectFile } from "@/contracts/project";
import { isDecided, STEPS, SUB_KEYS, type StopId, type VisualKey } from "@/domain/decisions";
import { ShortcutLegend } from "./ShortcutLegend";
import { StopList, SubDecisionList } from "./SubDecisionList";
import { profileDecidedCount, profileRows, type ProfileStop } from "./steps/profile/model";

export function Rail({ project, stop, onPick }: { project: ProjectFile; stop: StopId; onPick: (id: StopId) => void }) {
  const productName = project.profile.name;
  const current = stop.startsWith("visual.") ? "visual" : stop === "principles" ? "principles" : "profile";
  const visualDecided = SUB_KEYS.filter((k) => isDecided(project.visual, k)).length;
  return (
    <nav aria-label="Wizard steps" className="flex h-full flex-col gap-3.5 border-r border-dw-line px-3 py-4">
      <p className="flex min-w-0 items-center gap-2 px-1 font-mono text-small font-medium tracking-[0.04em] uppercase">
        <span aria-hidden="true" className="inline-block size-3 shrink-0 border-[1.5px] border-dw-text" />
        <span className="truncate">Design Wizard{productName ? ` · ${productName}` : ""}</span>
      </p>
      <ol className="flex flex-col">
        {STEPS.map((step) => {
          const isCurrent = step.id === current;
          const summary =
            step.id === "profile"
              ? `${profileDecidedCount(project)} of 3 decided`
              : step.id === "visual"
                ? `${visualDecided} of ${SUB_KEYS.length} decided`
                : "Not built yet";
          return (
            <li
              key={step.id}
              aria-current={isCurrent ? "step" : undefined}
              className={`grid min-h-11 grid-cols-[22px_minmax(0,1fr)] items-start gap-1.5 border-t border-dw-line py-2.5 pr-1 ${
                isCurrent ? "border-l-2 border-l-dw-accent pl-2" : "pl-1"
              }`}
            >
              <span className="font-mono text-label leading-5 text-dw-text-muted tabular-nums">{String(step.number).padStart(2, "0")}</span>
              <span className="flex min-w-0 flex-col">
                <span className="font-medium">{step.title}</span>
                <span className="text-small text-dw-text-muted">{summary}</span>
                {step.id === "profile" && (
                  <span className="mt-1.5 -ml-1.5 block">
                    <StopList<ProfileStop> rows={profileRows(project)} current={current === "profile" ? (stop as ProfileStop) : null} onPick={onPick} />
                  </span>
                )}
                {step.id === "principles" && (
                  <span className="mt-1.5 -ml-1.5 block">
                    <StopList rows={[{ id: "principles" as const, label: "UX principles", value: null }]} current={isCurrent ? "principles" : null} onPick={onPick} />
                  </span>
                )}
                {step.id === "visual" && (
                  <span className="mt-1.5 -ml-1.5 block">
                    <SubDecisionList
                      visual={project.visual}
                      current={current === "visual" ? (stop.slice("visual.".length) as VisualKey) : null}
                      onPick={(k) => onPick(`visual.${k}`)}
                    />
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
