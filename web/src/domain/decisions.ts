// Owner of the wizard's ordered steps, the list of decisions, which are open, and the export gate
// (docs/ARCHITECTURE.md §4). The parser and the exporters both ask this module.
import type { ProjectFile, Visual } from "@/contracts/project";

/** Every decision, in wizard order. `null` = open. notes and componentLibrary are not decisions. */
export const DECISIONS: readonly { path: string; label: string; get: (p: ProjectFile) => unknown }[] = [
  { path: "profile.name", label: "Project name", get: (p) => p.profile?.name },
  { path: "profile.productType", label: "Product type", get: (p) => p.profile?.productType },
  { path: "profile.platform", label: "Platform", get: (p) => p.profile?.platform },
  { path: "principles", label: "UX principles", get: (p) => p.principles },
  { path: "visual.fontPair", label: "Font pair", get: (p) => p.visual?.fontPair },
  { path: "visual.spacingBase", label: "Spacing base", get: (p) => p.visual?.spacingBase },
  { path: "visual.radius", label: "Radius", get: (p) => p.visual?.radius },
  { path: "visual.brandHex", label: "Brand colour", get: (p) => p.visual?.brandHex },
  { path: "visual.paletteVariant", label: "Palette", get: (p) => p.visual?.paletteVariant },
  { path: "visual.density", label: "Density", get: (p) => p.visual?.density },
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

/** The visual-system sub-decisions in wizard order (step 3), and the variants each shows side by side. */
export const VISUAL_SUBDECISIONS = [
  { key: "fontPair", label: "Font pair" },
  { key: "spacingBase", label: "Spacing" },
  { key: "radius", label: "Radius" },
  { key: "paletteVariant", label: "Brand colour → palette" },
  { key: "density", label: "Density" },
] as const;
export type VisualKey = (typeof VISUAL_SUBDECISIONS)[number]["key"];

/** Fixed candidates shown as 3 variants. Font pairs and palettes come from content/ and palette.ts. */
export const VISUAL_CANDIDATES = {
  spacingBase: [4, 6, 8],
  radius: [0, 6, 14],
  density: ["compact", "balanced", "airy"],
} as const;

/**
 * The 3 values shown for spacing or radius. A saved value that isn't a fixed candidate (a file may hold
 * any valid value) replaces the nearest candidate, so the user's choice is always on screen.
 */
export function numericCandidates(key: "spacingBase" | "radius", saved: number | null): number[] {
  const fixed: number[] = [...VISUAL_CANDIDATES[key]];
  if (saved === null || fixed.includes(saved)) return fixed;
  let nearest = 0;
  fixed.forEach((v, i) => {
    if (Math.abs(v - saved) < Math.abs(fixed[nearest] - saved)) nearest = i;
  });
  fixed[nearest] = saved;
  return fixed.sort((a, b) => a - b);
}

/**
 * Splits n items into the fewest pages of at most 3, as evenly as possible (7 → 3, 2, 2), so every
 * page shows 2–3 variants side by side and nothing repeats. Returns [start, end) per page.
 */
export function evenPages(n: number, max = 3): [number, number][] {
  const count = Math.max(1, Math.ceil(n / max));
  const base = Math.floor(n / count);
  const extra = n % count;
  const pages: [number, number][] = [];
  let start = 0;
  for (let i = 0; i < count; i++) {
    const size = base + (i < extra ? 1 : 0);
    pages.push([start, start + size]);
    start += size;
  }
  return pages;
}

/** Visual sub-decision keys in wizard order. */
export const SUB_KEYS: readonly VisualKey[] = VISUAL_SUBDECISIONS.map((s) => s.key);

/** The palette sub-decision needs both the brand colour and a variant. */
export function isDecided(v: Visual, key: VisualKey): boolean {
  return key === "paletteVariant" ? v.paletteVariant !== null && v.brandHex !== null : v[key] !== null;
}

export function firstOpen(v: Visual): VisualKey | null {
  return SUB_KEYS.find((k) => !isDecided(v, k)) ?? null;
}

/** The next open sub-decision after `from`, wrapping around; null when every other one is decided. */
export function nextOpenAfter(v: Visual, from: VisualKey): VisualKey | null {
  const i = SUB_KEYS.indexOf(from);
  for (let n = 1; n < SUB_KEYS.length; n++) {
    const k = SUB_KEYS[(i + n) % SUB_KEYS.length];
    if (!isDecided(v, k)) return k;
  }
  return null;
}

/** E: the nearest decided sub-decision before `from`, else the last decided one. */
export function lastDecidedBefore(v: Visual, from: VisualKey): VisualKey | null {
  const i = SUB_KEYS.indexOf(from);
  for (let n = i - 1; n >= 0; n--) if (isDecided(v, SUB_KEYS[n])) return SUB_KEYS[n];
  for (let n = SUB_KEYS.length - 1; n > i; n--) if (isDecided(v, SUB_KEYS[n])) return SUB_KEYS[n];
  return null;
}

/**
 * Every stop the user moves through with J/K/E, across steps, in wizard order (design/specs/step-1-profile.md).
 * Step 2 is one stop until the laws picker exists. componentLibrary is never null, so it is always decided.
 */
export const STOPS = [
  { id: "profile.identity", step: "profile", label: "Name & type" },
  { id: "profile.platform", step: "profile", label: "Platform" },
  { id: "profile.library", step: "profile", label: "Component library" },
  { id: "principles", step: "principles", label: "UX principles" },
  ...VISUAL_SUBDECISIONS.map((s) => ({ id: `visual.${s.key}` as const, step: "visual" as const, label: s.label })),
] as const;
export type StopId = (typeof STOPS)[number]["id"];
const STOP_IDS: readonly StopId[] = STOPS.map((s) => s.id);

/** The step a stop belongs to (from STOPS, not from the id string). */
export function stepOfStop(id: StopId): StepId {
  return (STOPS.find((s) => s.id === id)?.step ?? "profile") as StepId;
}

export function isStopId(id: string): id is StopId {
  return (STOP_IDS as readonly string[]).includes(id);
}

export function isStopDecided(p: ProjectFile, id: StopId): boolean {
  switch (id) {
    case "profile.identity":
      return p.profile.name !== null && p.profile.productType !== null;
    case "profile.platform":
      return p.profile.platform !== null;
    case "profile.library":
      return true;
    case "principles":
      return p.principles !== null;
    default:
      return isDecided(p.visual, id.slice("visual.".length) as VisualKey);
  }
}

/** The stop after `id` in order (choosing moves on in order, so every stop is seen once); null at the end. */
export function nextStop(id: StopId): StopId | null {
  return STOP_IDS[STOP_IDS.indexOf(id) + 1] ?? null;
}

export function prevStop(id: StopId): StopId | null {
  const i = STOP_IDS.indexOf(id);
  return i > 0 ? STOP_IDS[i - 1] : null;
}

/** E across steps: the nearest decided stop before `id`, else the last decided one after it. */
export function lastDecidedStopBefore(p: ProjectFile, id: StopId): StopId | null {
  const i = STOP_IDS.indexOf(id);
  for (let n = i - 1; n >= 0; n--) if (isStopDecided(p, STOP_IDS[n])) return STOP_IDS[n];
  for (let n = STOP_IDS.length - 1; n > i; n--) if (isStopDecided(p, STOP_IDS[n])) return STOP_IDS[n];
  return null;
}

export function firstOpenStop(p: ProjectFile): StopId | null {
  return STOP_IDS.find((id) => !isStopDecided(p, id)) ?? null;
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
