"use client";
import type { ProjectFile } from "@/contracts/project";
import { SUB_KEYS, VISUAL_SUBDECISIONS, type StopId } from "@/domain/decisions";
import { PreviewPlate } from "@/components/wizard/LivePreview";
import { ArrowText } from "@/components/wizard/ArrowText";
import { valueLabel } from "@/components/wizard/steps/visual/model";

// Step 4: every decision on one sample screen, full size. Nothing to decide here; each row reopens its decision.
export function PreviewStep({ project, onMove }: { project: ProjectFile; onMove: (id: StopId) => void }) {
  const { visual, profile } = project;
  const rows: { id: StopId; label: string; value: string | null }[] = [
    { id: "profile.identity", label: "Product name", value: profile.name },
    ...SUB_KEYS.map((k) => ({
      id: `visual.${k}` as const,
      label: VISUAL_SUBDECISIONS.find((s) => s.key === k)?.label ?? k,
      value: valueLabel(visual, k),
    })),
  ];
  return (
    <>
      <p className="font-mono text-label font-medium tracking-[0.08em] text-dw-text-muted uppercase">Step 04 · Live preview</p>
      <h1 id="stop-title" tabIndex={-1} className="mt-1.5 text-title font-semibold tracking-[-0.025em]">
        Live preview
      </h1>
      <p className="mt-1 max-w-[60ch] text-dw-text-muted">
        The sample screen in every decision you have made; open decisions show in preview-only neutrals.
      </p>
      <div className="mt-5 max-w-[720px]">
        <PreviewPlate visual={visual} candidate={null} productName={profile.name} />
      </div>
      <h2 className="mt-6 font-mono text-label font-medium tracking-[0.08em] text-dw-text-muted uppercase">Decisions shown</h2>
      <ul className="mt-2 flex max-w-[720px] flex-col border-b border-dw-line">
        {rows.map((r) => (
          <li key={r.id} className="border-t border-dw-line">
            <button
              type="button"
              onClick={() => onMove(r.id)}
              className="flex min-h-11 w-full items-center justify-between gap-4 px-2 text-left hover:bg-dw-hover"
            >
              <span className="font-medium">
                <ArrowText text={r.label} />
              </span>
              <span className={`min-w-0 truncate font-mono text-label ${r.value === null ? "text-dw-text-muted" : ""}`}>
                {r.value ?? "pending"}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-dw-text-muted">Export is built next.</p>
    </>
  );
}
