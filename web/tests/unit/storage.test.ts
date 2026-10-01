import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import { QUARANTINE_KEY, STORAGE_KEY } from "@/data/project/storage";
import { createProjectStore } from "@/data/project/store";

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
const now = () => new Date("2026-10-01T10:00:00.000Z");

test("an opened project is autosaved and restored on the next start", () => {
  const storage = new MemoryStorage();
  const first = createProjectStore(storage, now);
  expect(first.open(harbour)).toEqual([]);
  expect(first.getState().savedAt).toBe("2026-10-01T10:00:00.000Z");

  const second = createProjectStore(storage, now);
  expect(second.getState().project.profile.name).toBe("Harbour");
  expect(second.getState().downloadedAt).toBeNull();
});

test("markDownloaded records when the durable copy was taken", () => {
  const storage = new MemoryStorage();
  const store = createProjectStore(storage, now);
  store.open(harbour);
  store.markDownloaded();
  expect(store.getState().downloadedAt).toBe("2026-10-01T10:00:00.000Z");
  expect(JSON.parse(storage.getItem(STORAGE_KEY)!).downloadedAt).toBe("2026-10-01T10:00:00.000Z");
});

test("a damaged saved copy is quarantined, not lost, and the store starts empty", () => {
  const storage = new MemoryStorage();
  const damaged = JSON.stringify({ savedAt: "x", downloadedAt: null, file: harbour.slice(0, 120) });
  storage.setItem(STORAGE_KEY, damaged);
  const store = createProjectStore(storage, now);
  expect(storage.getItem(QUARANTINE_KEY)).toBe(damaged);
  expect(storage.getItem(STORAGE_KEY)).toBeNull();
  expect(store.getState().project.profile.name).toBeNull();
  expect(store.getState().errors.map((e) => e.code)).toEqual(["json-syntax"]);
});

test("the stored snapshot is never replaced silently", () => {
  const store = createProjectStore(null, now);
  store.open(harbour);
  // Harbour's palette was chosen by hand, so a fresh computation differs: the UI must ask.
  expect(store.getState().snapshotDiffers).toBe(true);
  const stored = store.getState().project.resolved;
  store.setProfile("notes", "Edited notes");
  store.setProfile("name", "Harbour Clinic");
  store.setProfile("componentLibrary", "none");
  expect(store.getState().project.resolved).toBe(stored);
  expect(store.getState().snapshotDiffers).toBe(true);
  store.keepSnapshot();
  expect(store.getState().snapshotDiffers).toBe(false);
  expect(store.getState().project.resolved).toBe(stored);
  store.recomputeSnapshot();
  expect(store.getState().project.resolved).not.toEqual(stored);
  expect(store.getState().project.resolved?.color.light.accent).toBe("#0F766E");
});

test("an opened file with every decision set but no snapshot is resolved on open", () => {
  const store = createProjectStore(null, now);
  store.open(harbour.replace(/"resolved": \{[\s\S]*\}\n\}\n$/, '"resolved": null\n}\n'));
  expect(store.getState().errors).toEqual([]);
  expect(store.getState().project.resolved).not.toBeNull();
  expect(store.getState().snapshotDiffers).toBe(false);
});
