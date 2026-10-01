// Curated content shapes (docs/CONTRACTS.md §5).
import type { CheckKind, Severity } from "./rules";

export type ParamUnit = "px" | "ms" | "count" | "ratio";

export interface LawParam {
  key: string;
  label: string;
  unit: ParamUnit;
  integer: boolean;
  /** 0 is a valid value only if min ≤ 0. */
  min: number;
  max: number;
  suggested: number;
}

export interface LawEntry {
  id: string;
  name: string;
  summary: string;
  when: string;
  rule: {
    key: string;
    /** Imperative sentence; each {paramKey} is filled from the params. */
    template: string;
    severity: Severity;
    check: { kind: CheckKind; selector: string | null; viewports: number[]; question?: string };
  };
  params: LawParam[];
  source: string;
}

export type FontRole = "display" | "text";

export interface FontEntry {
  /** Equals the folder name under web/public/fonts/. */
  id: string;
  family: string;
  generic: "sans-serif" | "serif" | "monospace";
  fontsource: string;
  subset: "latin";
  files: { weight: number; style: "normal"; file: string }[];
  license: "OFL-1.1";
  /** Equals the first line of the family's OFL.txt. */
  copyright: string;
  roles: FontRole[];
}

export interface FontPairEntry {
  id: string;
  display: { font: string; weights: number[] };
  text: { font: string; weights: number[] };
  note: string;
}
