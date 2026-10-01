// Canonical JSON bytes: 2-space indent, LF, one trailing newline, shortest number form.
// Callers build objects in contract key order; this never sorts keys.
export function stableJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
