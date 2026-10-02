// Only shortcuts that work are listed. Labels are words ("Enter"), per the DESIGN.md glyph rule.
// v0.1 has no Ctrl K menu and no "Apply fix" key.
const SHORTCUTS: readonly { keys: readonly string[]; label: string }[] = [
  { keys: ["1", "2", "3"], label: "Pick variant" },
  { keys: ["Enter"], label: "Choose variant" },
  { keys: ["J", "K"], label: "Next / previous decision" },
  { keys: ["E"], label: "Reopen last decision" },
];

const LAWS_KEY = { keys: ["Space"], label: "Add or remove law" } as const;

/** On step 2, Space replaces "1 2 3 Pick variant" (laws are not variants) and Enter continues. Step 4 has nothing to pick. */
export function ShortcutLegend({ className = "", laws = false, view = false }: { className?: string; laws?: boolean; view?: boolean }) {
  const list = view ? SHORTCUTS.slice(2) : laws ? [LAWS_KEY, { keys: ["Enter"], label: "Continue" }, ...SHORTCUTS.slice(2)] : SHORTCUTS;
  return (
    <dl aria-label="Keyboard shortcuts" className={`grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 text-small ${className}`}>
      {list.map((s) => (
        <div key={s.label} className="contents">
          <dt className="flex gap-1">
            {s.keys.map((k) => (
              <kbd key={k}>{k}</kbd>
            ))}
          </dt>
          <dd className="text-dw-text-muted">{s.label}</dd>
        </div>
      ))}
    </dl>
  );
}
