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
  let state: ProjectState = { project: emptyProject(), errors: [], savedAt: null, downloadedAt: null };
  const listeners = new Set<() => void>();
  const emit = (next: ProjectState) => {
    state = next;
    listeners.forEach((l) => l());
  };
  const persist = (project: ProjectFile, downloadedAt: string | null) =>
    storage ? save(storage, serialize(project), now(), downloadedAt).savedAt : null;

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
      emit({ project: result.project, errors: [], savedAt: persist(result.project, null), downloadedAt: null });
      return [];
    },
    replace(project) {
      emit({ ...state, project, errors: [], savedAt: persist(project, state.downloadedAt) });
    },
    markDownloaded() {
      const downloadedAt = now().toISOString();
      emit({ ...state, downloadedAt, savedAt: persist(state.project, downloadedAt) });
    },
  };
}

let browserStore: ProjectStore | null = null;
const serverState: ProjectState = { project: emptyProject(), errors: [], savedAt: null, downloadedAt: null };

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
