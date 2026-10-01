// The project store: the only writer of project state (docs/ARCHITECTURE.md §1).
// Every change is autosaved; an invalid file never replaces the current state.
// `resolved` is recomputed only when something it depends on changes (visual decisions, laws) or a
// decision opens or closes; a file's stored snapshot is never replaced silently (CONTRACTS §1).
import { useSyncExternalStore } from "react";
import type { ParseError } from "@/contracts/errors";
import type { Principle, ProjectFile, Profile, Visual } from "@/contracts/project";
import { palette } from "@/domain/color/palette";
import { openDecisions } from "@/domain/decisions";
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
  /** False only in the server snapshot (static HTML before hydration); the UI waits for the real project. */
  hydrated: boolean;
  /** The opened file's stored snapshot differs from a fresh computation: the UI asks keep or recompute. */
  snapshotDiffers: boolean;
}

export interface ProjectStore {
  getState(): ProjectState;
  subscribe(listener: () => void): () => void;
  /** Parses `text`; on success it replaces the project, otherwise only `errors` change. */
  open(text: string): ParseError[];
  replace(project: ProjectFile): void;
  /** Decision actions: each autosaves; `resolved` is null while any decision is open. */
  setProfile<K extends keyof Profile>(key: K, value: Profile[K]): void;
  setPrinciples(principles: Principle[] | null): void;
  setVisual<K extends keyof Visual>(key: K, value: Visual[K]): void;
  markDownloaded(): void;
  /** Answers to the "Stored values differ" notice: keep the file's snapshot, or replace it with a fresh one. */
  keepSnapshot(): void;
  recomputeSnapshot(): void;
  /** Dev only (?fixture=): open fixture text and pretend it was saved at `savedAt`. */
  openDevFixture(text: string, savedAt: string | null): void;
}

export function createProjectStore(storage: Storage | null, now: () => Date = () => new Date()): ProjectStore {
  let state: ProjectState = { project: emptyProject(), errors: [], savedAt: null, downloadedAt: null, saveFailed: false, hydrated: true, snapshotDiffers: false };
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

/**
   * Every change goes through here. While any decision is open, `resolved` is null. Otherwise it is
   * recomputed only if the change affects it (visual decisions, laws) or there is none yet; editing
   * the name, product type, platform, notes or component library keeps the stored snapshot.
   */
  const decide = (next: ProjectFile, affectsSnapshot: boolean) => {
    const open = openDecisions(next).length > 0;
    const resolved = open ? null : affectsSnapshot || next.resolved === null ? resolveSnapshot(next) : next.resolved;
    const project = { ...next, resolved };
    const snapshotDiffers = !open && !affectsSnapshot && state.snapshotDiffers;
    emit({ ...state, project, errors: [], snapshotDiffers, ...persist(project, state.downloadedAt) });
  };

  /** Opened or restored file: resolve it if every decision is set but there is no snapshot; else compare. */
  const settle = (p: ProjectFile): { project: ProjectFile; snapshotDiffers: boolean; changed: boolean } => {
    if (openDecisions(p).length > 0 || p.principles === null) return { project: p, snapshotDiffers: false, changed: false };
    const fresh = resolveSnapshot(p);
    if (p.resolved === null) return { project: { ...p, resolved: fresh }, snapshotDiffers: false, changed: fresh !== null };
    const differs = fresh !== null && serialize({ ...p, resolved: fresh }) !== serialize(p);
    return { project: p, snapshotDiffers: differs, changed: false };
  };

  if (storage) {
    const restored = restore(storage);
    if (restored.kind === "restored") {
      const { project, snapshotDiffers } = settle(restored.project);
      state = { ...state, project, snapshotDiffers, savedAt: restored.envelope.savedAt, downloadedAt: restored.envelope.downloadedAt };
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
      const { project, snapshotDiffers } = settle(result.project);
      emit({ ...state, project, errors: [], downloadedAt: null, snapshotDiffers, ...persist(project, null) });
      return [];
    },
    replace(project) {
      emit({ ...state, project, errors: [], snapshotDiffers: false, ...persist(project, state.downloadedAt) });
    },
    setProfile(key, value) {
      decide({ ...state.project, profile: { ...state.project.profile, [key]: value } }, false);
    },
    setPrinciples(principles) {
      decide({ ...state.project, principles }, true);
    },
    setVisual(key, value) {
      const visual = { ...state.project.visual, [key]: value };
      // A new brand colour that can't produce the chosen palette reopens the palette decision.
      if (key === "brandHex" && visual.brandHex !== null && visual.paletteVariant !== null && palette(visual.brandHex, visual.paletteVariant) === null) {
        visual.paletteVariant = null;
      }
      decide({ ...state.project, visual }, true);
    },
    openDevFixture(text, savedAt) {
      const errors = this.open(text);
      if (errors.length === 0) emit({ ...state, savedAt });
    },
    keepSnapshot() {
      emit({ ...state, snapshotDiffers: false });
    },
    recomputeSnapshot() {
      const project = { ...state.project, resolved: resolveSnapshot(state.project) };
      emit({ ...state, project, snapshotDiffers: false, ...persist(project, state.downloadedAt) });
    },
    markDownloaded() {
      const downloadedAt = now().toISOString();
      emit({ ...state, downloadedAt, ...persist(state.project, downloadedAt) });
    },
  };
}

let browserStore: ProjectStore | null = null;
const serverState: ProjectState = { project: emptyProject(), errors: [], savedAt: null, downloadedAt: null, saveFailed: false, hydrated: false, snapshotDiffers: false };

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
