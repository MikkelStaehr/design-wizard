// Project rule (CLAUDE.md): every store action that changes `resolved` goes through one transition,
// and each action has a test that a kept snapshot survives it (or is replaced only as documented).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import { createProjectStore, type ProjectStore } from "@/data/project/store";

// Harbour as written in slice 1, before the palette algorithm: its stored colours differ from a fresh
// computation on purpose, so it opens with "Stored values differ" (task 3f).
const harbour = readFileSync(join(__dirname, "..", "fixtures", "harbour-stale.project.json"), "utf8");

/** Harbour opened and its differing snapshot kept: the state every case starts from. */
function kept(): { store: ProjectStore; snapshot: string } {
  const store = createProjectStore(null, () => new Date("2026-10-02T10:00:00.000Z"));
  store.open(harbour);
  store.keepSnapshot();
  return { store, snapshot: JSON.stringify(store.getState().project.resolved) };
}

const p = () => kept().store.getState().project;

const KEEPS: [string, (s: ProjectStore) => void][] = [
  ["setProfile name", (s) => s.setProfile("name", "Harbour Clinic")],
  ["setProfile productType", (s) => s.setProfile("productType", "Booking")],
  ["setProfile platform", (s) => s.setProfile("platform", "both")],
  ["setProfile notes", (s) => s.setProfile("notes", "New notes")],
  ["setProfile componentLibrary", (s) => s.setProfile("componentLibrary", "none")],
  ["setVisual fontPair, same value", (s) => s.setVisual("fontPair", p().visual.fontPair)],
  ["setVisual spacingBase, same value", (s) => s.setVisual("spacingBase", p().visual.spacingBase)],
  ["setVisual radius, same value", (s) => s.setVisual("radius", p().visual.radius)],
  ["setVisual density, same value", (s) => s.setVisual("density", p().visual.density)],
  ["setVisual brandHex, same value", (s) => s.setVisual("brandHex", p().visual.brandHex)],
  ["setVisual paletteVariant, same value", (s) => s.setVisual("paletteVariant", p().visual.paletteVariant)],
  ["setPrinciples, same laws", (s) => s.setPrinciples(p().principles)],
  ["setPrinciples null then back (parked)", (s) => {
    const laws = s.getState().project.principles;
    s.setPrinciples(null);
    s.setPrinciples(laws);
  }],
  ["markDownloaded", (s) => s.markDownloaded()],
];

test.each(KEEPS)("%s keeps the kept snapshot byte-identical", (_, act) => {
  const { store, snapshot } = kept();
  act(store);
  expect(JSON.stringify(store.getState().project.resolved)).toBe(snapshot);
  expect(store.getState().recomputedBy).toBeNull();
});

test("setPrinciples with a real change rebuilds only resolved.rules", () => {
  const { store, snapshot } = kept();
  const before = JSON.parse(snapshot);
  store.setPrinciples(store.getState().project.principles!.slice(0, 2));
  const after = store.getState().project.resolved!;
  expect({ ...after, rules: [] }).toEqual({ ...before, rules: [] });
  expect(after.rules.map((r) => r.law)).toEqual(["fitts", "hick"]);
});

test("setVisual with a real change recomputes and says so when the old snapshot differed", () => {
  const store = createProjectStore(null);
  store.open(harbour);
  expect(store.getState().snapshotDiffers).toBe(true);
  store.setVisual("radius", 6);
  expect(store.getState().project.resolved?.radius).toBe(6);
  expect(store.getState().recomputedBy).toBe("Radius");
  expect(store.getState().snapshotDiffers).toBe(false);
});

test("recomputeSnapshot replaces it; undoRecompute restores it byte-identically", () => {
  const { store, snapshot } = kept();
  store.recomputeSnapshot();
  expect(JSON.stringify(store.getState().project.resolved)).not.toBe(snapshot);
  store.undoRecompute();
  expect(JSON.stringify(store.getState().project.resolved)).toBe(snapshot);
});

test("undoOpen puts back the kept snapshot and its differs flag byte-identically", () => {
  const { store, snapshot } = kept();
  const before = store.getState();
  store.open(harbour, "harbour.dwproj.json");
  store.undoOpen();
  expect(JSON.stringify(store.getState().project.resolved)).toBe(snapshot);
  expect(store.getState().snapshotDiffers).toBe(before.snapshotDiffers);
  expect(store.getState().savedAt).toBe(before.savedAt);
});

test("fileVersion changes when another file is opened or replaces the project, never on a decision", () => {
  const { store } = kept();
  const v = store.getState().fileVersion;
  store.setProfile("notes", "x");
  store.setVisual("radius", 6);
  expect(store.getState().fileVersion).toBe(v);
  store.open(harbour);
  expect(store.getState().fileVersion).toBe(v + 1);
  expect(store.open("{ broken")).not.toEqual([]);
  expect(store.getState().fileVersion).toBe(v + 1);
});
