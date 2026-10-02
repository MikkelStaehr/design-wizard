// Slice 3a tester checks: profile validation, null-until-set, the snapshot rule (CONTRACTS §1) and the
// component-library switch in the exported DESIGN.md, against the real Harbour fixture and the real store.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { validate } from "@/components/wizard/steps/profile/identity";
import { emptyProject } from "@/data/project/empty";
import { parse } from "@/data/project/parse";
import { serialize } from "@/data/project/serialize";
import { STORAGE_KEY } from "@/data/project/storage";
import { createProjectStore } from "@/data/project/store";
import { openDecisions } from "@/domain/decisions";
import { resolveSnapshot } from "@/domain/tokens/resolve";
import { exportAll } from "@/export";

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  key(i: number) {
    return [...this.map.keys()][i] ?? null;
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
}

const harbour = readFileSync(join(__dirname, "..", "..", "fixtures", "harbour.project.json"), "utf8");
// Harbour as written in slice 1, before the palette algorithm: its stored colours differ from a fresh
// computation on purpose, so it opens with "Stored values differ" (task 3f).
const harbourStale = readFileSync(join(__dirname, "..", "fixtures", "harbour-stale.project.json"), "utf8");
const now = () => new Date("2026-10-01T10:00:00.000Z");
const savedFile = (s: Storage) => JSON.parse(JSON.parse(s.getItem(STORAGE_KEY)!).file);
const resolvedBytes = (s: Storage) => JSON.stringify(savedFile(s).resolved);

describe("name and product type validation (identity.tsx validate)", () => {
  test("80 characters plus a trailing space passes; 81 fails with the over-by count", () => {
    expect(validate("name", "H".repeat(80) + " ", null)).toBeNull();
    expect(validate("name", "H".repeat(81), null)).toMatch(/81 characters; the limit is 80\. Shorten it by 1\./);
  });

  test("empty and whitespace-only names give the empty error, naming the saved value when there is one", () => {
    expect(validate("name", "", null)).toMatch(/the name stays open/);
    expect(validate("name", "   ", "Harbour")).toMatch(/Harbour stays saved/);
  });

  test("a line break inside the name or type is rejected", () => {
    expect(validate("name", "Har\nbour", null)).toMatch(/one line/);
    expect(validate("productType", "Clinic\r\nbooking", null)).toMatch(/one line/);
  });

  test("Danish letters and emoji are accepted", () => {
    expect(validate("name", "Nørrebro Fysioterapi", null)).toBeNull();
    expect(validate("name", "Æblegården ÅØ", null)).toBeNull();
    expect(validate("name", "Harbour 🚢", null)).toBeNull();
  });

  test("validator and parser agree on the emoji boundary (both count UTF-16 units)", () => {
    const forty = "🚢".repeat(40); // 80 UTF-16 units
    const fortyOne = "🚢".repeat(41); // 82 units, 41 code points
    expect(validate("name", forty, null)).toBeNull();
    expect(validate("name", fortyOne, null)).not.toBeNull();
    const file = (name: string) => serialize({ ...emptyProject(), profile: { ...emptyProject().profile, name } });
    expect(parse(file(forty)).ok).toBe(true);
    expect(parse(file(fortyOne)).ok).toBe(false);
  });

  test("product type: 60 passes, 61 fails, empty fails", () => {
    expect(validate("productType", "T".repeat(60), null)).toBeNull();
    expect(validate("productType", "T".repeat(61), null)).toMatch(/61 characters; the limit is 60\. Shorten it by 1\./);
    expect(validate("productType", "  ", null)).toMatch(/Enter a product type/);
  });

  test("notes: empty is valid, 2001 characters is not", () => {
    expect(validate("notes", "", null)).toBeNull();
    expect(validate("notes", "n".repeat(2001), null)).toMatch(/limit is 2000/);
  });
});

describe("profile decisions stay open until set", () => {
  test("a new project has name, type and platform null and componentLibrary shadcn", () => {
    const p = emptyProject();
    expect(p.profile).toMatchObject({ name: null, productType: null, platform: null, componentLibrary: "shadcn" });
    expect(openDecisions(p).slice(0, 3)).toEqual(["Project name", "Product type", "Platform"]);
  });

  test("setting only the name leaves productType and platform null in the saved file", () => {
    const storage = new MemoryStorage();
    const store = createProjectStore(storage, now);
    store.setProfile("name", "Harbour");
    expect(savedFile(storage).profile).toMatchObject({ name: "Harbour", productType: null, platform: null, componentLibrary: "shadcn" });
    expect(savedFile(storage).resolved).toBeNull();
  });

  test("profile values survive a restart (AC10) and a download then open", () => {
    const storage = new MemoryStorage();
    const store = createProjectStore(storage, now);
    store.setProfile("name", "Harbour");
    store.setProfile("productType", "Clinic booking");
    store.setProfile("platform", "mobile");
    store.setProfile("componentLibrary", "none");
    const want = { name: "Harbour", productType: "Clinic booking", platform: "mobile", componentLibrary: "none" };
    expect(createProjectStore(storage, now).getState().project.profile).toMatchObject(want);
    const other = createProjectStore(new MemoryStorage(), now);
    expect(other.open(serialize(store.getState().project))).toEqual([]);
    expect(other.getState().project.profile).toMatchObject(want);
  });
});

describe("snapshot rule on Harbour (CONTRACTS §1)", () => {
  const opened = () => {
    const storage = new MemoryStorage();
    const store = createProjectStore(storage, now);
    expect(store.open(harbourStale)).toEqual([]);
    return { storage, store };
  };

  test("Harbour opens with the notice", () => {
    expect(opened().store.getState().snapshotDiffers).toBe(true);
  });

  test("editing notes, name, type, platform and library never changes resolved, and the notice stays", () => {
    const { storage, store } = opened();
    const before = resolvedBytes(storage);
    store.setProfile("notes", "Changed notes");
    store.setProfile("name", "Nørrebro Fysioterapi");
    store.setProfile("productType", "Clinic booking app");
    store.setProfile("platform", "both");
    store.setProfile("componentLibrary", "none");
    store.setProfile("componentLibrary", "shadcn");
    expect(resolvedBytes(storage)).toBe(before);
    expect(store.getState().snapshotDiffers).toBe(true);
  });

  test("Keep stored values leaves resolved byte-identical and clears the notice", () => {
    const { storage, store } = opened();
    const before = resolvedBytes(storage);
    store.keepSnapshot();
    expect(resolvedBytes(storage)).toBe(before);
    expect(store.getState().snapshotDiffers).toBe(false);
  });

  test("Recompute now replaces resolved with a fresh computation, and a restart shows no notice", () => {
    const { storage, store } = opened();
    const before = resolvedBytes(storage);
    store.recomputeSnapshot();
    const fresh = JSON.stringify(resolveSnapshot(store.getState().project));
    expect(resolvedBytes(storage)).toBe(fresh);
    expect(resolvedBytes(storage)).not.toBe(before);
    expect(store.getState().snapshotDiffers).toBe(false);
    expect(createProjectStore(storage, now).getState().snapshotDiffers).toBe(false);
  });

  test("a file with every decision set and resolved null is resolved on open", () => {
    const file = { ...JSON.parse(harbour), resolved: null };
    const store = createProjectStore(new MemoryStorage(), now);
    expect(store.open(JSON.stringify(file))).toEqual([]);
    expect(store.getState().project.resolved).toEqual(resolveSnapshot(store.getState().project));
    expect(store.getState().snapshotDiffers).toBe(false);
  });

  test("a restored autosave with every decision set and resolved null is resolved and saved back (marked changed)", () => {
    const storage = new MemoryStorage();
    const file = serialize({ ...JSON.parse(harbour), resolved: null });
    storage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: "2026-10-01T09:00:00.000Z", downloadedAt: null, file }));
    const store = createProjectStore(storage, now);
    expect(store.getState().project.resolved).not.toBeNull();
    expect(savedFile(storage).resolved).not.toBeNull();
  });
});

describe("component library in the exported DESIGN.md", () => {
  test("choosing none swaps the shadcn block for the role-named CSS block; tokens.json is unchanged", () => {
    const store = createProjectStore(new MemoryStorage(), now);
    store.open(harbour);
    const shadcn = exportAll(store.getState().project);
    store.setProfile("componentLibrary", "none");
    const none = exportAll(store.getState().project);
    expect(shadcn["DESIGN.md"]).toContain("**shadcn/ui variables**");
    expect(shadcn["DESIGN.md"]).not.toContain("**CSS variables**");
    expect(none["DESIGN.md"]).toContain("**CSS variables**");
    expect(none["DESIGN.md"]).not.toContain("**shadcn/ui variables**");
    expect(none["DESIGN.md"]).toMatch(/--accent: #[0-9A-Fa-f]{6};/);
    expect(none["DESIGN.md"]).not.toMatch(/--primary:/);
    expect(none["tokens.json"]).toBe(shadcn["tokens.json"]);
  });
});
