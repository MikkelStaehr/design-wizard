"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { STEPS, type StepId, type VisualKey } from "@/domain/decisions";
import { useProject } from "@/data/project/store";
import { ownsKey } from "@/components/plate/PlateGrid";
import { Rail } from "./Rail";
import { VisualStep } from "./steps/visual/VisualStep";
import { firstOpen, lastDecidedBefore, SUB_KEYS } from "./steps/visual/model";

/** ?step=visual.<key> opens a sub-decision directly (screenshots); "palette" is accepted for paletteVariant. */
function subFromSearch(search: string): VisualKey | null {
  const step = new URLSearchParams(search).get("step");
  if (!step?.startsWith("visual.")) return null;
  const key = step.slice("visual.".length);
  const alias = key === "palette" ? "paletteVariant" : key === "spacing" ? "spacingBase" : key;
  return (SUB_KEYS as readonly string[]).includes(alias) ? (alias as VisualKey) : null;
}

const noSubscribe = () => () => {};

/** Display only: the row already shows the path, so drop a leading "<path> " and capitalise. Parser messages are unchanged. */
function withoutPath(path: string, message: string): string {
  const rest = path !== "" && message.startsWith(`${path} `) ? message.slice(path.length + 1) : message;
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

// Layout from DESIGN.md "Space & density": ≥1101px rail 232 | main | preview 340;
// 761–1100px rail 200 + main with the preview below; ≤760px one column, rail and legend hidden.
export function WizardShell({ current }: { current: StepId }) {
  const { project, errors, saveFailed } = useProject();
  const visual = project.visual;
  const productName = project.profile.name;
  const step = STEPS.find((s) => s.id === current) ?? STEPS[0];
  const [picked, setPicked] = useState<VisualKey | null>(null);
  /** Until the user moves, the step opens on the first open sub-decision (the project may load after first render). */
  const fromUrl = useSyncExternalStore(noSubscribe, () => subFromSearch(window.location.search), () => null);
  const sub: VisualKey = picked ?? fromUrl ?? firstOpen(visual) ?? SUB_KEYS[0];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || ownsKey(e.target, e.key)) return;
      const k = e.key.toLowerCase();
      const i = SUB_KEYS.indexOf(sub);
      if (k === "j" && i < SUB_KEYS.length - 1) setPicked(SUB_KEYS[i + 1]);
      else if (k === "k" && i > 0) setPicked(SUB_KEYS[i - 1]);
      else if (k === "e") {
        const back = lastDecidedBefore(visual, sub);
        if (back) setPicked(back);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sub, visual]);

  return (
    <div className="min-h-dvh min-[761px]:grid min-[761px]:grid-cols-[200px_minmax(0,1fr)] min-[1101px]:grid-cols-[232px_minmax(0,1fr)_340px]">
      <header className="flex min-h-11 items-center justify-between border-b border-dw-line px-4 min-[761px]:hidden">
        <span className="font-mono text-label font-medium tracking-[0.08em] uppercase">Design Wizard</span>
        <span className="font-mono text-label text-dw-text-muted">
          Step {step.number} of {STEPS.length}
        </span>
      </header>
      <aside className="hidden min-[761px]:block min-[761px]:row-span-2 min-[1101px]:row-span-1">
        <Rail current={current} productName={productName} visual={visual} sub={sub} onPick={setPicked} />
      </aside>
      <main className="min-w-0 px-4 pt-5 pb-8 min-[761px]:px-6">
        {errors.length > 0 && (
          <section role="alert" aria-labelledby="file-errors-title" className="mb-5 border border-dw-ctl bg-dw-surface px-4 py-3">
            <h2 id="file-errors-title" className="font-medium">
              The project file could not be opened: {errors.length} {errors.length === 1 ? "problem" : "problems"}
            </h2>
            <p className="text-small text-dw-text-muted">Nothing was replaced. Fix these in the file and open it again.</p>
            <ul className="mt-2 flex flex-col">
              {errors.map((err, i) => (
                <li key={`${err.path}:${i}`} className="grid grid-cols-1 gap-x-4 border-t border-dw-line py-1.5 min-[761px]:grid-cols-[minmax(0,14rem)_1fr]">
                  <code className="font-mono text-label break-all">{err.path === "" ? "(whole file)" : err.path}</code>
                  <span className="text-small">{withoutPath(err.path, err.message)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        {saveFailed && (
          <p role="status" className="mb-5 border border-dw-ctl bg-dw-surface px-4 py-2 text-small">
            This browser did not save your last change. Keep the tab open until you can download the project file.
          </p>
        )}
        {current === "visual" ? (
          <VisualStep sub={sub} visual={visual} productName={productName} onMove={setPicked} />
        ) : (
          <>
            <h1 className="text-title font-semibold tracking-[-0.025em]">{step.title}</h1>
            <p role="status" className="mt-6 border border-dashed border-dw-ctl px-4 py-6 text-dw-text-muted">
              This step is not built yet.
            </p>
          </>
        )}
      </main>
      <section
        aria-labelledby="preview-label"
        className="border-t border-dw-line px-4 py-5 min-[761px]:col-start-2 min-[761px]:px-6 min-[1101px]:col-start-3 min-[1101px]:row-start-1 min-[1101px]:border-t-0 min-[1101px]:border-l min-[1101px]:px-4"
      >
        <p id="preview-label" className="font-mono text-label font-medium tracking-[0.08em] text-dw-text-muted uppercase">
          Live preview
        </p>
        <div className="mt-3 bg-dw-plate p-[18px]">
          <p className="bg-dw-surface px-4 py-8 text-center text-dw-text-muted">The live preview arrives with step 4.</p>
        </div>
      </section>
    </div>
  );
}
