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
  parked: { resolved: Resolved; snapshotDiffers: boolean } | null;
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
  let state: ProjectState = { project: emptyProject(), errors: [], savedAt: null, downloadedAt: null, saveFailed: false, hydrated: true, snapshotDiffers: false, recomputedBy: null, previousResolved: null, parked: null };
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
  const decide = (next: ProjectFile, affectsSnapshot: boolean, label: string) => {
    const open = openDecisions(next).length > 0;
    const before = state.project.resolved;
    // Park the snapshot while a decision is open; bring it back if it closes without a real change.
    const parked = open ? (before !== null ? { resolved: before, snapshotDiffers: state.snapshotDiffers } : state.parked) : affectsSnapshot ? null : state.parked;
    const restore = !open && !affectsSnapshot && next.resolved === null && state.parked !== null;
    const resolved = open
      ? null
      : restore
        ? state.parked!.resolved
        : affectsSnapshot || next.resolved === null
          ? resolveSnapshot(next)
          : next.resolved;
    const project = { ...next, resolved };
    // A real change to a decision the snapshot depends on replaces it; say so if it differed.
    const recomputedBy = affectsSnapshot && (state.snapshotDiffers || state.parked?.snapshotDiffers) ? label : affectsSnapshot ? null : state.recomputedBy;
    const snapshotDiffers = open ? false : restore ? state.parked!.snapshotDiffers : !affectsSnapshot && state.snapshotDiffers;
    emit({ ...state, project, errors: [], snapshotDiffers, recomputedBy, previousResolved: null, parked: restore ? null : parked, ...persist(project, state.downloadedAt) });
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
      emit({ ...state, project, errors: [], downloadedAt: null, snapshotDiffers, parked: null, ...persist(project, null) });
      return [];
    },
    replace(project) {
      emit({ ...state, project, errors: [], snapshotDiffers: false, parked: null, ...persist(project, state.downloadedAt) });
    },
    setProfile(key, value) {
      decide({ ...state.project, profile: { ...state.project.profile, [key]: value } }, false, labelOf(`profile.${String(key)}`));
    },
    setPrinciples(principles) {
      // Re-choosing the same laws is not a change. A real change updates only resolved.rules, so a
      // stored (kept) snapshot's colours, fonts and scales are never replaced by a law or param tweak.
      if (JSON.stringify(state.project.principles) === JSON.stringify(principles)) return;
      const next = { ...state.project, principles };
      const open = openDecisions(next).length > 0 || principles === null;
      const before = state.project.resolved;
      if (open) {
        // Unticking the last law parks the snapshot (a kept, differing one included).
        const parked = before !== null ? { resolved: before, snapshotDiffers: state.snapshotDiffers } : state.parked;
        const project = { ...next, resolved: null };
        emit({ ...state, project, errors: [], snapshotDiffers: false, previousResolved: null, parked, ...persist(project, state.downloadedAt) });
        return;
      }
      const base = before ?? state.parked?.resolved ?? null;
      const resolved = base !== null ? { ...base, rules: resolveRules(principles) } : resolveSnapshot(next);
      const snapshotDiffers = before !== null ? state.snapshotDiffers : (state.parked?.snapshotDiffers ?? false);
      const project = { ...next, resolved };
      emit({ ...state, project, errors: [], snapshotDiffers, previousResolved: null, parked: null, ...persist(project, state.downloadedAt) });
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
      decide({ ...state.project, visual }, changed, labelOf(`visual.${String(key)}`));
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
const serverState: ProjectState = { project: emptyProject(), errors: [], savedAt: null, downloadedAt: null, saveFailed: false, hydrated: false, snapshotDiffers: false, recomputedBy: null, previousResolved: null, parked: null };

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
