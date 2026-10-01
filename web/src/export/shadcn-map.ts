// Role → shadcn/ui variable (docs/CONTRACTS.md §4.2). The optional export layer, used only when
// profile.componentLibrary is "shadcn". The only stack-specific module.
import type { ColorRole } from "@/contracts/project";
import { sharedThemeLines } from "./css-vars";
import type { Tokens } from "./tokens-json";

export interface ShadcnRow {
  vars: string[];
  roles: (ColorRole | "radius.base")[];
  note: string;
}

/** One row per line of the DESIGN.md table; `roles[i]` belongs to `vars[i]` (or to all, if one role). */
export const SHADCN_ROWS: readonly ShadcnRow[] = [
  { vars: ["--background"], roles: ["bg"], note: "" },
  { vars: ["--foreground"], roles: ["text"], note: "" },
  { vars: ["--card", "--popover"], roles: ["bg"], note: "As in shadcn's defaults, cards sit on the page colour" },
  { vars: ["--card-foreground", "--popover-foreground"], roles: ["text"], note: "" },
  { vars: ["--primary"], roles: ["accent"], note: "" },
  { vars: ["--primary-foreground"], roles: ["on-accent"], note: "" },
  { vars: ["--secondary", "--muted"], roles: ["surface"], note: "" },
  { vars: ["--secondary-foreground"], roles: ["text"], note: "" },
  { vars: ["--muted-foreground"], roles: ["text-muted"], note: "" },
  { vars: ["--accent"], roles: ["surface"], note: "shadcn's hover/highlight background, not the brand accent" },
  { vars: ["--accent-foreground"], roles: ["text"], note: "" },
  { vars: ["--destructive"], roles: ["negative"], note: "shadcn v4's destructive button hard-codes white text: open: design-lead" },
  { vars: ["--border", "--input"], roles: ["border"], note: "" },
  { vars: ["--ring"], roles: ["focus"], note: "" },
  {
    vars: ["--sidebar", "--sidebar-foreground", "--sidebar-primary", "--sidebar-primary-foreground", "--sidebar-accent", "--sidebar-accent-foreground", "--sidebar-border", "--sidebar-ring"],
    roles: ["bg", "text", "accent", "on-accent", "surface", "text", "border", "focus"],
    note: "",
  },
  { vars: ["--positive", "--warning"], roles: ["positive", "warning"], note: "Not in shadcn; added" },
  { vars: ["--radius"], roles: ["radius.base"], note: "" },
];

const roleOf = (row: ShadcnRow, i: number) => row.roles[row.roles.length === 1 ? 0 : i];

/** The DESIGN.md table rows, including the open chart row. */
export function shadcnTable(): string[] {
  const rows = SHADCN_ROWS.map((row) => {
    // One role per variable, in variable order, so a reader can match them up.
    const roles = row.roles.map((r) => `\`${r}\``).join(", ");
    return `| ${row.vars.map((v) => `\`${v}\``).join(", ")} | ${roles} |${row.note ? ` ${row.note} ` : " "}|`;
  });
  rows.splice(rows.length - 2, 0, "| `--chart-1` … `--chart-5` | – | open: design-lead (no data-visualisation palette in v0.1) |");
  return ["| shadcn variable | Part B role | Note |", "|---|---|---|", ...rows];
}

export function shadcnCss(t: Tokens): string {
  const root: string[] = [];
  for (const row of SHADCN_ROWS) {
    row.vars.forEach((v, i) => {
      const role = roleOf(row, i);
      if (role === "radius.base") root.push(`  ${v}: ${t.radius.base.$value.value}${t.radius.base.$value.unit}; /* radius.base */`);
      else root.push(`  ${v}: ${t.color[role].$value.hex}; /* color.${role} */`);
    });
  }
  const theme = ["  --color-positive: var(--positive);", "  --color-warning: var(--warning);", ...sharedThemeLines(t)];
  return [":root {", ...root, "}", "@theme inline {", ...theme, "}"].join("\n");
}
