// Role-named CSS block for projects without shadcn (docs/CONTRACTS.md §4.2a), plus the
// Tailwind v4 theme lines both CSS blocks share. Input is the tokens object, so C4 can recompute it.
import { COLOR_ROLES } from "@/contracts/project";
import type { Tokens } from "./tokens-json";

const px = (t: Tokens["radius"]["base"]) => `${t.$value.value}${t.$value.unit}`;

/** Font, type scale, line-height and spacing lines inside `@theme inline`. */
export function sharedThemeLines(t: Tokens): string[] {
  const display = t.font.display.$value;
  const text = t.font.text.$value;
  const lines = [
    `  --font-display: var(--font-display-face), ${display[1]}; /* font.display: ${display[0]} */`,
    `  --font-sans: var(--font-text-face), ${text[1]}; /* font.text: ${text[0]} */`,
  ];
  for (const [k, tok] of Object.entries(t["font-size"])) lines.push(`  --text-${k}: ${tok.$value.value}rem; /* font-size.${k} */`);
  lines.push(`  --leading-text: ${t["line-height"].text.$value}; /* line-height.text */`);
  lines.push(`  --leading-display: ${t["line-height"].display.$value}; /* line-height.display */`);
  lines.push(`  --spacing: ${px(t.space["1"])}; /* space.1; Tailwind multiplies, so p-4 = space.4 */`);
  return lines;
}

export function roleCss(t: Tokens): string {
  const root = COLOR_ROLES.map((role) => `  --${role}: ${t.color[role].$value.hex}; /* color.${role} */`);
  root.push(`  --radius: ${px(t.radius.base)}; /* radius.base */`);
  const theme = COLOR_ROLES.map((role) => `  --color-${role}: var(--${role});`);
  return [":root {", ...root, "}", "@theme inline {", ...theme, ...sharedThemeLines(t), "}"].join("\n");
}
