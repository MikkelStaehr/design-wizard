// Owner of the wizard's ordered steps and decisions (docs/ARCHITECTURE.md §4).
// Slice 1 has the step order only; open decisions and the export gate arrive with the project file.

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
