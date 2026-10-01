// ux-rules.yaml v1 rule shape (docs/CONTRACTS.md §3), also stored in resolved.rules.

export const CHECK_KINDS = ["min-target-size", "max-count", "contrast", "response-time", "focus-visible", "manual"] as const;
export type CheckKind = (typeof CHECK_KINDS)[number];

/** The exact param keys each kind takes. */
export const CHECK_PARAMS: Record<CheckKind, readonly string[]> = {
  "min-target-size": ["minPx"],
  "max-count": ["max"],
  contrast: ["minRatio"],
  "response-time": ["maxMs"],
  "focus-visible": ["minOutlinePx"],
  manual: [],
};

export type Severity = "must" | "should";

export interface RuleCheck {
  kind: CheckKind;
  /** CSS selector; null for manual only. */
  selector: string | null;
  params: Record<string, number>;
  /** Ascending, unique, 320–2560 px. */
  viewports: number[];
  /** manual only, required there. */
  question?: string;
}

export interface Rule {
  id: string;
  law: string;
  when: string;
  rule: string;
  severity: Severity;
  check: RuleCheck;
}
