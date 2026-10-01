// The project store: the only writer of project state (docs/ARCHITECTURE.md §1).
// Every change is autosaved; an invalid file never replaces the current state.
// Slice 2 adds decision actions and resolving `resolved` once every decision is set.
import { useSyncExternalStore } from "react";
import type { ParseError } from "@/contracts/errors";
import type { ProjectFile } from "@/contracts/project";
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
  markDownloaded(): void;
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
