// Markdown escaping for user text in the exported DESIGN.md (docs/CONTRACTS.md §4).
export function mdEscape(text: string): string {
  return text.replace(/[\\`*_[\]<>|]/g, (ch) => `\\${ch}`).replace(/^#/, "\\#");
}
