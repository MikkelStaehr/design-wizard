// Form input is not file input (docs/CONTRACTS.md §1): people type "8", "8px", "8,0" or "0f766e".
// Returns the value, or a message to show next to the field. Junk is never coerced into a value.
import type { Hex } from "@/contracts/project";

export type InputResult<T> = { ok: true; value: T } | { ok: false; message: string };

export function parseHexInput(raw: string): InputResult<Hex> {
  const s = raw.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(s)) return { ok: true, value: `#${s.toUpperCase()}` };
  if (/^[0-9a-fA-F]{3}$/.test(s)) return { ok: true, value: `#${[...s].map((c) => c + c).join("").toUpperCase()}` };
  return { ok: false, message: "Enter a colour as 6 hex digits, like #0F766E." };
}

/** A number with an optional unit, dot or comma decimals. `integer` rejects fractions instead of rounding. */
export function parseNumberInput(raw: string, opts: { min: number; max: number; integer: boolean; unit?: string }): InputResult<number> {
  const unit = opts.unit ? `(?:\\s*${opts.unit})?` : "";
  const m = new RegExp(`^\\s*(-?\\d+(?:[.,]\\d+)?)${unit}\\s*$`, "i").exec(raw);
  const range = `${opts.min}–${opts.max}${opts.unit ? ` ${opts.unit}` : ""}`;
  if (!m) return { ok: false, message: `Enter a number from ${range}.` };
  const value = Number(m[1].replace(",", "."));
  if (opts.integer && !Number.isInteger(value)) return { ok: false, message: `Enter a whole number from ${range}.` };
  if (value < opts.min || value > opts.max) return { ok: false, message: `Enter a number from ${range}. You entered ${m[1]}.` };
  return { ok: true, value };
}
