import { STEPS, type StepId } from "@/domain/decisions";
import { ShortcutLegend } from "./ShortcutLegend";

export function Rail({ current }: { current: StepId }) {
  return (
    <nav aria-label="Wizard steps" className="flex h-full flex-col border-r border-dw-line px-3 py-4">
      <p className="px-1 font-mono text-label font-medium tracking-[0.08em] uppercase">Design Wizard</p>
      <ol className="mt-4 border-t border-dw-line">
        {STEPS.map((step) => {
          const isCurrent = step.id === current;
          return (
            <li
              key={step.id}
              aria-current={isCurrent ? "step" : undefined}
              className={`flex min-h-11 items-baseline gap-3 border-b border-dw-line py-2.5 pr-1 ${
                isCurrent ? "border-l-2 border-l-dw-accent pl-2" : "pl-2.5"
              }`}
            >
              <span className="font-mono text-label text-dw-text-muted tabular-nums">
                {String(step.number).padStart(2, "0")}
              </span>
              <span className="flex flex-col">
                <span className="font-medium">{step.title}</span>
                <span className="text-small text-dw-text-muted">{isCurrent ? "Not started" : step.summary}</span>
              </span>
            </li>
          );
        })}
      </ol>
      <ShortcutLegend className="mt-auto pt-6" />
    </nav>
  );
}
