// The project store: the only writer of project state (docs/ARCHITECTURE.md §1).
// Every change is autosaved; an invalid file never replaces the current state.
// `resolved` is recomputed only when something it depends on changes (visual decisions, laws) or a
// decision opens or closes; a file's stored snapshot is never replaced silently (CONTRACTS §1).
import { useSyncExternalStore } from "react";
import type { ParseError } from "@/contracts/errors";
import type { Principle, ProjectFile, Profile, Resolved, Visual } from "@/contracts/project";
import { palette } from "@/domain/color/palette";
import { DECISIONS, openDecisions } from "@/domain/decisions";
import { resolveRules, resolveSnapshot } from "@/domain/tokens/resolve";
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
  /** Set when a real decision change replaced a snapshot that differed: "Changing {label} recomputed every stored value." */
  recomputedBy: string | null;
  /** The snapshot before "Recompute now", kept for Undo until the next change. */
  previousResolved: Resolved | null;
  /** The snapshot set aside while a decision is open again, and whether it differed; restored when it closes. */
  parked: { resolved: Resolved; snapshotDiffers: boolean; pending: "none" | "rules" | "all"; pendingLabel: string | null } | null;
  /** Increments when open() or replace() puts another file's content in place; per-file UI state keys on it. */
  fileVersion: number;
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
  /** Undo "Recompute now": put the stored snapshot back and show the notice again. */
  undoRecompute(): void;
  /** Dev only (?fixture=): open fixture text and pretend it was saved at `savedAt`. */
  openDevFixture(text: string, savedAt: string | null): void;
}

export function createProjectStore(storage: Storage | null, now: () => Date = () => new Date()): ProjectStore {
  let state: ProjectState = { project: emptyProject(), errors: [], savedAt: null, downloadedAt: null, saveFailed: false, hydrated: true, snapshotDiffers: false, recomputedBy: null, previousResolved: null, parked: null, fileVersion: 0 };
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
   * THE transition for every decision change (project rule: one function, one test per action).
   * - impact "none": nothing the snapshot depends on changed (profile edits, re-choosing a value).
   * - impact "rules": the laws changed; only resolved.rules is rebuilt.
   * - impact "all": a visual decision changed; the snapshot is recomputed, and if the old one
   *   differed from the algorithm the UI says "Changing {label} recomputed every stored value."
   * While any decision is open the snapshot is parked (with its "differs" flag), and it comes back
   * when the decision closes again, so a stored or kept snapshot is never replaced silently.
   */
  type Impact = "none" | "rules" | "all";
  const RANK: Record<Impact, number> = { none: 0, rules: 1, all: 2 };
  const stronger = (a: Impact, b: Impact): Impact => (RANK[a] >= RANK[b] ? a : b);
  const transition = (next: ProjectFile, impact: Impact, label: string) => {
    const open = openDecisions(next).length > 0;
    const before = state.project.resolved;
    if (open) {
      // Park the snapshot, and remember the strongest change made while parked (so it is never restored stale).
      const prev = before !== null ? { resolved: before, snapshotDiffers: state.snapshotDiffers, pending: "none" as Impact, pendingLabel: null } : state.parked;
      const parked = prev === null ? null : {
        ...prev,
        pending: stronger(prev.pending, impact),
        pendingLabel: prev.pendingLabel ?? (impact === "all" ? label : null),
      };
      const project = { ...next, resolved: null };
      emit({ ...state, project, errors: [], snapshotDiffers: false, previousResolved: null, parked, ...persist(project, state.downloadedAt) });
      return;
    }
    const base = before ?? state.parked?.resolved ?? null;
    const differed = before !== null ? state.snapshotDiffers : (state.parked?.snapshotDiffers ?? false);
    // A change made while the snapshot was parked still counts when it comes back.
    if (before === null && state.parked !== null) {
      if (stronger(impact, state.parked.pending) !== impact) label = state.parked.pendingLabel ?? label;
      impact = stronger(impact, state.parked.pending);
    }
    let resolved: Resolved | null;
    let snapshotDiffers: boolean;
    let recomputedBy = state.recomputedBy;
    if (impact === "all" || base === null) {
      resolved = resolveSnapshot(next);
      snapshotDiffers = false;
      if (impact === "all") recomputedBy = base !== null && differed ? label : null;
    } else if (impact === "rules") {
      resolved = { ...base, rules: resolveRules(next.principles ?? []) };
      snapshotDiffers = differed;
    } else {
      resolved = base;
      snapshotDiffers = differed;
    }
    const project = { ...next, resolved };
    emit({ ...state, project, errors: [], snapshotDiffers, recomputedBy, previousResolved: null, parked: null, ...persist(project, state.downloadedAt) });
  };
  const labelOf = (path: string) => DECISIONS.find((d) => d.path === path)?.label ?? path;

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
      const { project, snapshotDiffers, changed } = settle(restored.project);
      state = { ...state, project, snapshotDiffers, savedAt: restored.envelope.savedAt, downloadedAt: restored.envelope.downloadedAt };
      // Resolved on load (CONTRACTS §1: the file is marked as changed), so save it back.
      if (changed) state = { ...state, ...persist(project, restored.envelope.downloadedAt) };
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
      emit({ ...state, project, errors: [], downloadedAt: null, snapshotDiffers, parked: null, fileVersion: state.fileVersion + 1, ...persist(project, null) });
      return [];
    },
    replace(project) {
      emit({ ...state, project, errors: [], snapshotDiffers: false, parked: null, fileVersion: state.fileVersion + 1, ...persist(project, state.downloadedAt) });
    },
    setProfile(key, value) {
      transition({ ...state.project, profile: { ...state.project.profile, [key]: value } }, "none", labelOf(`profile.${String(key)}`));
    },
    setPrinciples(principles) {
      // Re-choosing the same laws is not a change; a real change rebuilds only resolved.rules.
      if (JSON.stringify(state.project.principles) === JSON.stringify(principles)) return;
      transition({ ...state.project, principles }, "rules", labelOf("principles"));
    },
    setVisual(key, value) {
      const visual = { ...state.project.visual, [key]: value };
      // A new brand colour that can't produce the chosen palette reopens the palette decision.
      let reopened = false;
      if (key === "brandHex" && visual.brandHex !== null && visual.paletteVariant !== null && palette(visual.brandHex, visual.paletteVariant) === null) {
        visual.paletteVariant = null;
        reopened = true;
      }
      // Re-choosing the value already chosen is not a change: it must not replace a stored snapshot.
      const changed = state.project.visual[key] !== value || reopened;
      transition({ ...state.project, visual }, changed ? "all" : "none", labelOf(`visual.${String(key)}`));
    },
    openDevFixture(text, savedAt) {
      const errors = this.open(text);
      if (errors.length === 0) emit({ ...state, savedAt });
    },
    keepSnapshot() {
      emit({ ...state, snapshotDiffers: false });
    },
    recomputeSnapshot() {
      const previousResolved = state.project.resolved;
      const project = { ...state.project, resolved: resolveSnapshot(state.project) };
      emit({ ...state, project, snapshotDiffers: false, recomputedBy: null, previousResolved, ...persist(project, state.downloadedAt) });
    },
    undoRecompute() {
      if (state.previousResolved === null) return;
      const project = { ...state.project, resolved: state.previousResolved };
      emit({ ...state, project, snapshotDiffers: true, previousResolved: null, ...persist(project, state.downloadedAt) });
    },
    markDownloaded() {
      const downloadedAt = now().toISOString();
      emit({ ...state, downloadedAt, ...persist(state.project, downloadedAt) });
    },
  };
}

let browserStore: ProjectStore | null = null;
const serverState: ProjectState = { project: emptyProject(), errors: [], savedAt: null, downloadedAt: null, saveFailed: false, hydrated: false, snapshotDiffers: false, recomputedBy: null, previousResolved: null, parked: null, fileVersion: 0 };

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
