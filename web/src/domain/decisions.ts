// Owner of the wizard's ordered steps, the list of decisions, which are open, and the export gate
// (docs/ARCHITECTURE.md §4). The parser and the exporters both ask this module.
import type { ProjectFile } from "@/contracts/project";

/** Every decision, in wizard order. `null` = open. notes and componentLibrary are not decisions. */
export const DECISIONS: readonly { path: string; label: string; get: (p: ProjectFile) => unknown }[] = [
  { path: "profile.name", label: "Project name", get: (p) => p.profile?.name },
  { path: "profile.productType", label: "Product type", get: (p) => p.profile?.productType },
  { path: "profile.platform", label: "Platform", get: (p) => p.profile?.platform },
  { path: "principles", label: "UX principles", get: (p) => p.principles },
  { path: "visual.fontPair", label: "Font pair", get: (p) => p.visual?.fontPair },
  { path: "visual.spacingBase", label: "Spacing base", get: (p) => p.visual?.spacingBase },
  { path: "visual.radius", label: "Radius", get: (p) => p.visual?.radius },
  { path: "visual.density", label: "Density", get: (p) => p.visual?.density },
  { path: "visual.brandHex", label: "Brand colour", get: (p) => p.visual?.brandHex },
  { path: "visual.paletteVariant", label: "Palette", get: (p) => p.visual?.paletteVariant },
];

/** Labels of the decisions that are still open (null), in wizard order. */
export function openDecisions(p: ProjectFile): string[] {
  return DECISIONS.filter((d) => d.get(p) === null).map((d) => d.label);
}

/** Export gate: every decision made and the snapshot resolved. Throws with every open decision named. */
export function assertExportable(p: ProjectFile): asserts p is ProjectFile & {
  profile: { name: string; productType: string; platform: NonNullable<ProjectFile["profile"]["platform"]> };
  principles: NonNullable<ProjectFile["principles"]>;
  resolved: NonNullable<ProjectFile["resolved"]>;
} {
  const open = openDecisions(p);
  if (open.length > 0) throw new Error(`Export is blocked. Still open: ${open.join(", ")}.`);
  if (p.resolved === null) throw new Error("Export is blocked: the design snapshot has not been resolved yet.");
}

export type StepId = "profile" | "principles" | "visual" | "preview" | "export";

export interface Step {
  readonly id: StepId;
  readonly number: number;
  readonly title: string;
  readonly summary: string;
}

export const STEPS: readonly Step[] = [
  { id: "profile", number: 1, title: "Project profile", summary: "Name, product type, platform" },
  { id: "principles", number: 2, title: "UX principles", summary: "Laws that become checkable rules" },
  { id: "visual", number: 3, title: "Visual system", summary: "Fonts, spacing, radius, palette, density" },
  { id: "preview", number: 4, title: "Live preview", summary: "Every decision on one sample screen" },
  { id: "export", number: 5, title: "Export", summary: "DESIGN.md · tokens.json · ux-rules.yaml" },
];
