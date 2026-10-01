import { STEPS, type StepId } from "@/domain/decisions";
import { Rail } from "./Rail";

// Layout from DESIGN.md "Space & density": ≥1101px rail 232 | main | preview 340;
// 761–1100px rail 200 + main with the preview below; ≤760px one column, rail and legend hidden.
export function WizardShell({ current }: { current: StepId }) {
  const step = STEPS.find((s) => s.id === current) ?? STEPS[0];
  return (
    <div className="min-h-dvh min-[761px]:grid min-[761px]:grid-cols-[200px_1fr] min-[1101px]:grid-cols-[232px_1fr_340px]">
      <header className="flex min-h-11 items-center justify-between border-b border-dw-line px-4 min-[761px]:hidden">
        <span className="font-mono text-label font-medium tracking-[0.08em] uppercase">Design Wizard</span>
        <span className="font-mono text-label text-dw-text-muted">
          Step {step.number} of {STEPS.length}
        </span>
      </header>
      <aside className="hidden min-[761px]:block min-[761px]:row-span-2 min-[1101px]:row-span-1">
        <Rail current={current} />
      </aside>
      <main className="px-4 py-5 min-[761px]:px-6">
        <p className="font-mono text-label font-medium tracking-[0.08em] text-dw-text-muted uppercase">
          Step {String(step.number).padStart(2, "0")} · {step.title}
        </p>
        <h1 className="mt-1 text-title font-semibold tracking-[-0.025em]">{step.title}</h1>
        <p className="mt-2 max-w-[60ch] text-dw-text-muted">
          Name the project and say who it is for. Every later decision builds on this.
        </p>
        <div role="status" className="mt-6 border border-dashed border-dw-ctl px-4 py-6 text-dw-text-muted">
          This step is not built yet.
        </div>
      </main>
      <section
        aria-labelledby="preview-label"
        className="border-t border-dw-line px-4 py-5 min-[761px]:col-start-2 min-[761px]:px-6 min-[1101px]:col-start-3 min-[1101px]:row-start-1 min-[1101px]:border-t-0 min-[1101px]:border-l"
      >
        <p id="preview-label" className="font-mono text-label font-medium tracking-[0.08em] text-dw-text-muted uppercase">
          Live preview
        </p>
        <div className="mt-3 bg-dw-plate p-[18px]">
          <p className="bg-dw-surface px-4 py-8 text-center text-dw-text-muted">
            The preview appears after the first visual decision.
          </p>
        </div>
      </section>
    </div>
  );
}
