"use client";
import { useRef, useState } from "react";
import { projectStore } from "@/data/project/store";
import { readFileText } from "@/data/project/file-io";

const SECONDARY =
  "inline-flex min-h-11 items-center justify-center rounded-sm border border-dw-ctl bg-dw-surface px-4 font-medium whitespace-nowrap hover:bg-[var(--dw-hover)]";

/**
 * Opens a .dwproj.json (design/specs/step-5-export.md §6). One tab stop: the visible button clicks the hidden
 * input. A valid file shows the shell's opened notice; an invalid one fills the errors panel and focuses its h2.
 */
export function OpenProjectButton({
  label = "Open project file…",
  withStatus = false,
  className = "",
  buttonClass = "w-full min-[761px]:w-auto",
}: {
  label?: string;
  withStatus?: boolean;
  className?: string;
  buttonClass?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function onPick(file: File | undefined) {
    if (input.current) input.current.value = ""; // the same file can be picked again
    if (!file) return;
    setStatus(`Reading ${file.name}…`);
    const text = await readFileText(file);
    const errors = projectStore().open(text, file.name);
    if (errors.length === 0) {
      setStatus(null);
      return;
    }
    setStatus(`${file.name} could not be opened: ${errors.length} ${errors.length === 1 ? "problem" : "problems"}, listed at the top. Nothing here changed.`);
    requestAnimationFrame(() => document.getElementById("file-errors-title")?.focus());
  }

  return (
    <span className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${className}`}>
      <button type="button" className={`${SECONDARY} ${buttonClass}`} onClick={() => input.current?.click()}>
        {label}
      </button>
      <input
        ref={input}
        type="file"
        accept=".json,application/json"
        tabIndex={-1}
        hidden
        onChange={(e) => void onPick(e.currentTarget.files?.[0])}
      />
      {withStatus && (
        <span role="status" className="text-small text-dw-text-muted">
          {status}
        </span>
      )}
    </span>
  );
}
