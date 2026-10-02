// Display formatting for the export step. A shown measurement is computed from its source, never typed.

/** UTF-8 byte length of a file's text: what the downloaded file will weigh. */
export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

/** "6,412 bytes" (en-GB grouping), "1 byte". */
export function formatBytes(n: number): string {
  return `${n.toLocaleString("en-GB")} ${n === 1 ? "byte" : "bytes"}`;
}

/** Local time of an ISO timestamp: "14:32" when it is today, "1 Oct, 14:32" otherwise. */
export function clockTime(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return time;
  return `${d.getDate()} ${d.toLocaleDateString("en-GB", { month: "short" })}, ${time}`;
}
