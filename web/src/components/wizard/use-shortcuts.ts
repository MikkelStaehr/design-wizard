// Keyboard shortcut helpers shared by the wizard shell and the plate grid.

/** True when the key belongs to the focused control (typing, or a button's own Enter). */
export function ownsKey(target: EventTarget | null, key: string): boolean {
  if (!(target instanceof HTMLElement)) return false;
  // A checkbox or radio owns only Space (its toggle); Enter, arrows and letters stay shortcuts.
  if (target instanceof HTMLInputElement && (target.type === "checkbox" || target.type === "radio")) return key === " ";
  if (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return true;
  return key === "Enter" && ["BUTTON", "A", "SUMMARY"].includes(target.tagName);
}
