// Acceptance 7: every offered palette passes AA for 50 seeded brand colours, and recomputing is fast.
import { expect, test } from "vitest";
import { checkPairs } from "@/domain/color/pairs";
import { hexToOklch, oklchToHex } from "@/domain/color/oklch";
import { palettes } from "@/domain/color/palette";

/** Deterministic seeds: the hard cases plus a fixed pseudo-random spread. */
function seeds(): string[] {
  const fixed = ["#FFFF00", "#000000", "#FFFFFF", "#777777", "#0F766E", "#FF0000", "#00FF00", "#0000FF", "#FF00FF", "#00FFFF"];
  let x = 20261001;
  const next = () => ((x = (x * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  const rest = Array.from({ length: 40 }, () =>
    `#${Array.from({ length: 3 }, () => Math.floor(next() * 256).toString(16).padStart(2, "0")).join("")}`.toUpperCase(),
  );
  return [...fixed, ...rest];
}

test.each(seeds())("%s: all three palettes are offered and every pair passes", (brand) => {
  const offered = palettes(brand);
  expect(offered.map((p) => p.variant)).toEqual(["quiet", "tinted", "deep"]);
  for (const { variant, colors } of offered) {
    const failing = checkPairs(colors).filter((p) => !p.pass).map((p) => `${variant} ${p.fg}/${p.bg} ${p.ratio.toFixed(2)}`);
    expect(failing).toEqual([]);
    for (const hex of Object.values(colors)) expect(hex).toMatch(/^#[0-9A-F]{6}$/);
  }
});

test("a brand colour that already passes is used as the accent unchanged", () => {
  const tinted = palettes("#0F766E").find((p) => p.variant === "tinted")!;
  expect(tinted.colors.accent).toBe("#0F766E");
  expect(tinted.colors["on-accent"]).toBe("#FFFFFF");
});

test("yellow is shifted for light palettes and gets dark text in the deep palette", () => {
  const [quiet, , deep] = palettes("#FFFF00");
  expect(quiet.colors.accent).not.toBe("#FFFF00");
  expect(deep.colors["on-accent"]).not.toBe("#FFFFFF");
});

test("the chrome-free quiet palette has no hue in its neutrals", () => {
  const quiet = palettes("#0F766E")[0].colors;
  for (const role of ["bg", "text", "text-muted", "border"] as const) {
    const [r, g, b] = [1, 3, 5].map((i) => quiet[role].slice(i, i + 2));
    expect(r === g && g === b, `${role} ${quiet[role]}`).toBe(true);
  }
});

test("OKLCH round-trips sRGB hex", () => {
  for (const hex of ["#0F766E", "#FFFF00", "#123456", "#FFFFFF", "#000000"]) expect(oklchToHex(hexToOklch(hex))).toBe(hex);
});

test("recomputing the palettes for a brand colour takes under 100 ms", () => {
  palettes("#0F766E");
  const start = performance.now();
  palettes("#3A7BD5");
  expect(performance.now() - start).toBeLessThan(100);
});
