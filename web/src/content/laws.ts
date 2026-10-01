import type { LawEntry } from "@/contracts/content";

// SEED, not the curated list. These four exist so the slice 1 contract fixtures cover the
// min-target-size, max-count, contrast and manual kinds. design-lead drafts the ~12 curated
// laws in slice 2 and the user approves them from side-by-side previews (docs/PLAN.md, decision 6).
export const LAWS: readonly LawEntry[] = [
  {
    id: "fitts",
    name: "Fitts's law",
    summary: "The time to hit a target depends on its distance and its size.",
    when: "Any screen with controls a user clicks or taps.",
    rule: {
      key: "target-size",
      template: "Make every interactive element at least {minPx} by {minPx}.",
      severity: "must",
      check: {
        kind: "min-target-size",
        selector: "a[href], button, input, select, textarea, [role=button], [tabindex]:not([tabindex='-1'])",
        viewports: [390, 1280],
      },
    },
    params: [{ key: "minPx", label: "Minimum target size", unit: "px", integer: true, min: 24, max: 64, suggested: 44 }],
    source: "Fitts, P. M. (1954). The information capacity of the human motor system in controlling the amplitude of movement.",
  },
  {
    id: "hick",
    name: "Hick's law",
    summary: "The time it takes to decide grows with the number of choices.",
    when: "Screens where the user picks one action from several.",
    rule: {
      key: "primary-actions",
      template: "Limit primary actions to {max} per screen.",
      severity: "must",
      check: { kind: "max-count", selector: "[data-primary-action]", viewports: [390, 1280] },
    },
    params: [{ key: "max", label: "Primary actions per screen", unit: "count", integer: true, min: 0, max: 5, suggested: 1 }],
    source: "Hick, W. E. (1952). On the rate of gain of information. Hyman, R. (1953).",
  },
  {
    id: "wcag-contrast",
    name: "Contrast minimum (WCAG 2.2, 1.4.3)",
    summary: "Text needs enough contrast against its background to be read with low vision.",
    when: "Every screen with text.",
    rule: {
      key: "text-contrast",
      template: "Give all body text a contrast ratio of at least {minRatio} against its background.",
      severity: "must",
      check: { kind: "contrast", selector: "p, li, td, th, label, a, button, h1, h2, h3, h4, h5, h6", viewports: [390, 1280] },
    },
    params: [{ key: "minRatio", label: "Minimum contrast ratio", unit: "ratio", integer: false, min: 3, max: 7, suggested: 4.5 }],
    source: "W3C, Web Content Accessibility Guidelines 2.2, Success Criterion 1.4.3.",
  },
  {
    id: "peak-end",
    name: "Peak-end rule",
    summary: "People judge an experience mostly by its most intense moment and by its end.",
    when: "Flows with a clear end, such as booking or sign-up.",
    rule: {
      key: "closing-screen",
      template: "End every main flow on a screen that confirms the result and offers one next step.",
      severity: "should",
      check: {
        kind: "manual",
        selector: null,
        viewports: [390, 1280],
        question: "At the end of the main flow, does the last screen say in plain words what happened and offer one next step?",
      },
    },
    params: [],
    source: "Kahneman, D., Fredrickson, B. L., Schreiber, C. A., Redelmeier, D. A. (1993).",
  },
];

export const LAW_BY_ID: ReadonlyMap<string, LawEntry> = new Map(LAWS.map((l) => [l.id, l]));
