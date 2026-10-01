import type { FontEntry } from "@/contracts/content";

// SEED catalogue for the slice 1 contract fixtures. design-lead curates ~8 families in slice 2.
// The chrome's own fonts (geist, ibm-plex-mono) also live in public/fonts/ but are not variant options.
export const FONTS: readonly FontEntry[] = [
  {
    id: "sora",
    family: "Sora",
    generic: "sans-serif",
    fontsource: "@fontsource/sora",
    subset: "latin",
    files: [
      { weight: 600, style: "normal", file: "sora-latin-600-normal.woff2" },
      { weight: 700, style: "normal", file: "sora-latin-700-normal.woff2" },
    ],
    license: "OFL-1.1",
    copyright: "Copyright 2019 The Sora Project Authors (https://github.com/sora-xor/sora-font)",
    roles: ["display"],
  },
  {
    id: "inter",
    family: "Inter",
    generic: "sans-serif",
    fontsource: "@fontsource/inter",
    subset: "latin",
    files: [
      { weight: 400, style: "normal", file: "inter-latin-400-normal.woff2" },
      { weight: 500, style: "normal", file: "inter-latin-500-normal.woff2" },
      { weight: 600, style: "normal", file: "inter-latin-600-normal.woff2" },
    ],
    license: "OFL-1.1",
    copyright: "Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter)",
    roles: ["display", "text"],
  },
];

export const FONT_BY_ID: ReadonlyMap<string, FontEntry> = new Map(FONTS.map((f) => [f.id, f]));
