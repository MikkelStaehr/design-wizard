import localFont from "next/font/local";

// Chrome fonts only (DESIGN.md Part B). Variant fonts are loaded at runtime by src/fonts/loader.ts.
// One copy of each file lives in public/fonts/<id>/ next to its OFL.txt.
export const geist = localFont({
  src: [
    { path: "../../public/fonts/geist/geist-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/geist/geist-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/geist/geist-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-geist",
  display: "swap",
});

export const plexMono = localFont({
  src: [
    { path: "../../public/fonts/ibm-plex-mono/ibm-plex-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/ibm-plex-mono/ibm-plex-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});
