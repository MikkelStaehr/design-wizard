// Shortcut labels match the user's OS (DESIGN.md glyph rule). v0.1 has no Ctrl K menu and no "Apply fix" key.
const SHORTCUTS: readonly { keys: readonly string[]; label: string }[] = [
  { keys: ["1", "2", "3"], label: "Pick variant" },
  { keys: ["J", "K"], label: "Next / previous decision" },
  { keys: ["E"], label: "Edit an earlier step" },
  { keys: ["Enter"], label: "Choose variant" },
];

export function ShortcutLegend({ className = "" }: { className?: string }) {
  return (
    <dl className={`grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 text-small ${className}`}>
      {SHORTCUTS.map((s) => (
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
