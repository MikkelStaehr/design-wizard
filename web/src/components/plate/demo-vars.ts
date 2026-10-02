import type { CSSProperties } from "react";

// Demo-only values for the step 2 DO / DON'T specimens (design/specs/step-2-principles.md §2).
// One constant: the colours drawn and the meta lines that state them both read from here.
// They are set inline as --v-demo-* inside the plate, so sample CSS still reads only --v-*.
export const DEMO_VALUES = {
  white: "#FFFFFF",
  /** 6.49:1 on white. */
  passGrey: "#5E5E5E",
  /** 2.82:1 on white. */
  failGrey: "#9A9A9A",
  targetPx: 44,
  tinyPx: 28,
} as const;

export const LAW_DEMO_VARS = {
  "--v-demo-white": DEMO_VALUES.white,
  "--v-demo-pass": DEMO_VALUES.passGrey,
  "--v-demo-fail": DEMO_VALUES.failGrey,
  "--v-demo-target": `${DEMO_VALUES.targetPx}px`,
  "--v-demo-tiny": `${DEMO_VALUES.tinyPx}px`,
} as CSSProperties;
