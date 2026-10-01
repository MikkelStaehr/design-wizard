// Hand-computed anchors keep domain/color/contrast.ts honest (docs/ARCHITECTURE.md §4).
import { expect, test } from "vitest";
import { contrastRatio, formatRatio, passes } from "@/domain/color/contrast";
import { checkPairs } from "@/domain/color/pairs";

test("black on white is 21:1 in either order", () => {
  expect(formatRatio(contrastRatio("#000000", "#FFFFFF"))).toBe("21.00");
  expect(contrastRatio("#FFFFFF", "#000000")).toBeCloseTo(21, 10);
});

test("#777777 on white is 4.47:1 and fails 4.5", () => {
  const r = contrastRatio("#777777", "#FFFFFF");
  expect(formatRatio(r)).toBe("4.47");
  expect(passes(r, 4.5)).toBe(false);
});

test("displayed ratios are floored, never rounded up into a pass", () => {
  expect(formatRatio(4.478)).toBe("4.47");
  expect(formatRatio(4.4999)).toBe("4.49");
  expect(formatRatio(contrastRatio("#527370", "#EEF6F4"))).toBe("4.72");
});

test("checkPairs reports a failing pair", () => {
  const colors = {
    bg: "#FFFFFF", surface: "#FFFFFF", border: "#767676", text: "#000000", "text-muted": "#777777", accent: "#0F766E",
    "on-accent": "#FFFFFF", positive: "#166534", warning: "#92400E", negative: "#B91C1C", focus: "#000000",
  };
  const failing = checkPairs(colors).filter((p) => !p.pass).map((p) => `${p.fg}/${p.bg}`);
  expect(failing).toEqual(["text-muted/bg", "text-muted/surface"]);
});
