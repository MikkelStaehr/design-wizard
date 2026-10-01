// Keyboard shortcut helpers shared by the wizard shell and the plate grid.

/** True when the key belongs to the focused control (typing, or a button's own Enter). */
export function ownsKey(target: EventTarget | null, key: string): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return true;
  return key === "Enter" && ["BUTTON", "A", "SUMMARY"].includes(target.tagName);
}
