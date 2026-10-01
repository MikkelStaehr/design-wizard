// The project store: the only writer of project state (docs/ARCHITECTURE.md §1).
// Every change is autosaved; an invalid file never replaces the current state.
// Slice 2 adds decision actions and resolving `resolved` once every decision is set.
import { useSyncExternalStore } from "react";
import type { ParseError } from "@/contracts/errors";
import type { Principle, ProjectFile, Profile, Visual } from "@/contracts/project";
import { palette } from "@/domain/color/palette";
import { resolveSnapshot } from "@/domain/tokens/resolve";
import { devFixtureName, devFixtureText } from "./dev-fixtures";
import { emptyProject } from "./empty";
import { parse } from "./parse";
import { serialize } from "./serialize";
import { restore, save } from "./storage";

export interface ProjectState {
  project: ProjectFile;
  /** Problems from the last open or restore; [] when there are none. */
  errors: ParseError[];
  savedAt: string | null;
  downloadedAt: string | null;
  /** True when the last autosave to this browser failed (full or blocked storage); the download is then the only copy. */
  saveFailed: boolean;
}

export interface ProjectStore {
  getState(): ProjectState;
  subscribe(listener: () => void): () => void;
  /** Parses `text`; on success it replaces the project, otherwise only `errors` change. */
  open(text: string): ParseError[];
  replace(project: ProjectFile): void;
  /** Decision actions: each recomputes `resolved` (null while any decision is open) and autosaves. */
  setProfile<K extends keyof Profile>(key: K, value: Profile[K]): void;
  setPrinciples(principles: Principle[] | null): void;
  setVisual<K extends keyof Visual>(key: K, value: Visual[K]): void;
  markDownloaded(): void;
  /** Dev only (?fixture=): open fixture text and pretend it was saved at `savedAt`. */
  openDevFixture(text: string, savedAt: string | null): void;
}

export function createProjectStore(storage: Storage | null, now: () => Date = () => new Date()): ProjectStore {
  let state: ProjectState = { project: emptyProject(), errors: [], savedAt: null, downloadedAt: null, saveFailed: false };
  const listeners = new Set<() => void>();
  const emit = (next: ProjectState) => {
    state = next;
    listeners.forEach((l) => l());
  };
  /** Returns the new savedAt and whether saving failed; never throws (quota or blocked storage). */
  const persist = (project: ProjectFile, downloadedAt: string | null): { savedAt: string | null; saveFailed: boolean } => {
    if (!storage) return { savedAt: state.savedAt, saveFailed: false };
    try {
      return { savedAt: save(storage, serialize(project), now(), downloadedAt).savedAt, saveFailed: false };
    } catch {
      return { savedAt: state.savedAt, saveFailed: true };
    }
  };

  /** Every decision change goes through here: recompute the snapshot, then save. */
  const decide = (next: ProjectFile) => {
    const project = { ...next, resolved: resolveSnapshot(next) };
    emit({ ...state, project, errors: [], ...persist(project, state.downloadedAt) });
  };

  if (storage) {
    const restored = restore(storage);
    if (restored.kind === "restored") {
      state = { ...state, project: restored.project, savedAt: restored.envelope.savedAt, downloadedAt: restored.envelope.downloadedAt };
    } else if (restored.kind === "quarantined") {
      state = { ...state, errors: restored.errors };
    }
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    open(text) {
      const result = parse(text);
      if (!result.ok) {
        emit({ ...state, errors: result.errors });
        return result.errors;
      }
      emit({ ...state, project: result.project, errors: [], downloadedAt: null, ...persist(result.project, null) });
      return [];
    },
    replace(project) {
      emit({ ...state, project, errors: [], ...persist(project, state.downloadedAt) });
    },
    setProfile(key, value) {
      decide({ ...state.project, profile: { ...state.project.profile, [key]: value } });
    },
    setPrinciples(principles) {
      decide({ ...state.project, principles });
    },
    setVisual(key, value) {
      const visual = { ...state.project.visual, [key]: value };
      // A new brand colour that can't produce the chosen palette reopens the palette decision.
      if (key === "brandHex" && visual.brandHex !== null && visual.paletteVariant !== null && palette(visual.brandHex, visual.paletteVariant) === null) {
        visual.paletteVariant = null;
      }
      decide({ ...state.project, visual });
    },
    openDevFixture(text, savedAt) {
      const errors = this.open(text);
      if (errors.length === 0) emit({ ...state, savedAt });
    },
    markDownloaded() {
      const downloadedAt = now().toISOString();
      emit({ ...state, downloadedAt, ...persist(state.project, downloadedAt) });
    },
  };
}

let browserStore: ProjectStore | null = null;
const serverState: ProjectState = { project: emptyProject(), errors: [], savedAt: null, downloadedAt: null, saveFailed: false };

function getBrowserStore(): ProjectStore {
  if (!browserStore) {
    const fixture = devFixtureName(window.location.search);
    if (fixture) {
      // A fixture never touches the real autosave: in-memory store, no storage.
      const store = createProjectStore(null);
      browserStore = store;
      void devFixtureText(fixture).then(({ text, savedAt }) => store.openDevFixture(text, savedAt));
      return store;
    }
    let storage: Storage | null = null;
    try {
      storage = window.localStorage;
    } catch {
      storage = null; // private mode or blocked storage: work in memory, the download stays the durable copy
    }
    browserStore = createProjectStore(storage);
  }
  return browserStore;
}

export function useProject(): ProjectState {
  return useSyncExternalStore(
    (l) => getBrowserStore().subscribe(l),
    () => getBrowserStore().getState(),
    () => serverState,
  );
}

export function projectStore(): ProjectStore {
  return getBrowserStore();
}
