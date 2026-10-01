// Download-name slug (docs/CONTRACTS.md §0): `Nørrebro: "Ida's" #1` → `norrebro-idas-1`.
const TRANSLIT: Record<string, string> = { æ: "ae", ø: "o", å: "a", ß: "ss", œ: "oe", þ: "th", đ: "d", ł: "l" };

export function slug(name: string): string {
  const s = name
    .toLowerCase()
    .replace(/[æøåßœþđł]/g, (ch) => TRANSLIT[ch])
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/['"’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/, "");
  return s === "" ? "project" : s;
}
