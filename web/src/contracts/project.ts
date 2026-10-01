// Project file v1 (docs/CONTRACTS.md §1). Types only: this module imports nothing from src.
import type { Rule } from "./rules";

export const SCHEMA_VERSION = 1;
export const FORMAT = "design-wizard-project";

export const PLATFORMS = ["desktop", "mobile", "both"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const COMPONENT_LIBRARIES = ["shadcn", "none"] as const;
export type ComponentLibrary = (typeof COMPONENT_LIBRARIES)[number];

export const DENSITIES = ["compact", "balanced", "airy"] as const;
export type Density = (typeof DENSITIES)[number];

export const PALETTE_VARIANTS = ["quiet", "tinted", "deep"] as const;
export type PaletteVariant = (typeof PALETTE_VARIANTS)[number];

/** The 10 Part B roles of design/DESIGN.template.md plus `on-accent`, in export order. */
export const COLOR_ROLES = [
  "bg", "surface", "border", "text", "text-muted", "accent", "on-accent", "positive", "warning", "negative", "focus",
] as const;
export type ColorRole = (typeof COLOR_ROLES)[number];

/** `#RRGGBB`, upper case. */
export type Hex = string;

export const FONT_SIZE_KEYS = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl"] as const;
export type FontSizeKey = (typeof FONT_SIZE_KEYS)[number];

export const SPACE_KEYS = ["1", "2", "3", "4", "6", "8", "12", "16"] as const;
export type SpaceKey = (typeof SPACE_KEYS)[number];

export interface Profile {
  /** null = open. 1–80 chars after trim. */
  name: string | null;
  /** null = open. 1–60 chars. */
  productType: string | null;
  platform: Platform | null;
  /** Not a decision; "" is valid. */
  notes: string;
  /** Never null: new projects start at "shadcn". */
  componentLibrary: ComponentLibrary;
}

export interface Principle {
  lawId: string;
  params: Record<string, number>;
}

export interface Visual {
  fontPair: string | null;
  /** px, 2–16. 0 is invalid. */
  spacingBase: number | null;
  /** px, 0–32. 0 is a valid radius. */
  radius: number | null;
  density: Density | null;
  brandHex: Hex | null;
  paletteVariant: PaletteVariant | null;
  /** Always {} in v0.1 ("Apply fix" is cut). */
  colorOverrides: Partial<Record<ColorRole, Hex>>;
}

export interface FontRef {
  catalogueId: string;
  family: string;
  generic: "sans-serif" | "serif" | "monospace";
  fontsource: string;
  subset: "latin";
  weights: number[];
  style: "normal";
  license: "OFL-1.1";
  copyright: string;
}

export interface Resolved {
  color: { light: Record<ColorRole, Hex>; dark: null };
  font: { display: FontRef; text: FontRef };
  /** rem, strictly ascending, 0.5–6. */
  fontSize: Record<FontSizeKey, number>;
  lineHeight: { text: number; display: number };
  /** px; equals key × spacingBase. */
  space: Record<SpaceKey, number>;
  /** px; 0 is valid. */
  radius: number;
  rules: Rule[];
}

export interface ProjectFile {
  schemaVersion: typeof SCHEMA_VERSION;
  format: typeof FORMAT;
  profile: Profile;
  /** null = open; [] = decided on zero laws. */
  principles: Principle[] | null;
  visual: Visual;
  /** null while any decision is open. */
  resolved: Resolved | null;
}
