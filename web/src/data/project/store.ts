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
import { restore, save, STORAGE_KEY } from "./storage";

export interface ProjectState {
  project: ProjectFile;
  /** Problems from the last open or restore; [] when there are none. */
  errors: ParseError[];
  /** When the file's text last changed (autosaved to this browser when storage works). */
  savedAt: string | null;
  /** Last time a file on disk matched the project: a project-file download, or a successful open (CONTRACTS §1). */
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
  /** What the last open() replaced, for Undo open; cleared by the next change, Keep/Recompute or another open. */
  replaced: Replaced | null;
  /** The opened notice: "Opened {fileName}.", or after Undo open "Back to …". Cleared with `replaced`. */
  openNotice: { fileName: string; undone: boolean } | null;
}

/** Everything open() replaced, restored byte for byte by undoOpen(). */
export type Replaced = Pick<ProjectState, "project" | "savedAt" | "downloadedAt" | "snapshotDiffers" | "recomputedBy" | "previousResolved" | "parked">;

export interface ProjectStore {
  getState(): ProjectState;
  subscribe(listener: () => void): () => void;
  /** Parses `text`; on success it replaces the project (undoOpen() brings it back), otherwise only `errors` change. */
  open(text: string, fileName?: string): ParseError[];
  undoOpen(): void;
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
  /** Dev only (?fixture=): open fixture text and pretend it was saved at `savedAt` and downloaded at `downloadedAt`. */
  openDevFixture(text: string, savedAt: string | null, downloadedAt?: string | null): void;
}

export function createProjectStore(storage: Storage | null, now: () => Date = () => new Date()): ProjectStore {
  let state: ProjectState = { project: emptyProject(), errors: [], savedAt: null, downloadedAt: null, saveFailed: false, hydrated: true, snapshotDiffers: false, recomputedBy: null, previousResolved: null, parked: null, fileVersion: 0, replaced: null, openNotice: null };
  const listeners = new Set<() => void>();
  const emit = (next: ProjectState) => {
    state = next;
    listeners.forEach((l) => l());
  };
  /** The canonical text savedAt belongs to: savedAt moves only when this text changes. */
  let lastText: string | null = null;
  /** `t`, or 1 ms after `floor` when `t` is not later (same millisecond, clock set back). */
  const after = (t: string, floor: string | null) => (floor === null || t > floor ? t : new Date(Date.parse(floor) + 1).toISOString());
  /**
   * Stamps and autosaves the project; never throws (quota or blocked storage). When the text changes, savedAt
   * becomes now (but always after downloadedAt), also when the save fails, so fileStatus
   * never reads an unsaved change as current. `savedAt` puts an exact value back (Undo open); null = never
   * saved, so the envelope is removed.
   */
  const persist = (project: ProjectFile, downloadedAt: string | null, opts: { savedAt?: string | null } = {}): { savedAt: string | null; saveFailed: boolean } => {
    const text = serialize(project);
    const savedAt = opts.savedAt !== undefined ? opts.savedAt : text === lastText ? state.savedAt : after(now().toISOString(), downloadedAt);
    lastText = text;
    try {
      if (storage && savedAt === null) storage.removeItem(STORAGE_KEY);
      else if (storage && savedAt !== null) save(storage, text, savedAt, downloadedAt);
      return { savedAt, saveFailed: false };
    } catch {
      return { savedAt, saveFailed: true };
    }
  };
  /** Undo open lasts until the next change. */
  const EXPIRE = { replaced: null, openNotice: null } as const;

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
      emit({ ...state, ...EXPIRE, project, errors: [], snapshotDiffers: false, previousResolved: null, parked, ...persist(project, state.downloadedAt) });
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
    emit({ ...state, ...EXPIRE, project, errors: [], snapshotDiffers, recomputedBy, previousResolved: null, parked: null, ...persist(project, state.downloadedAt) });
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
      lastText = restored.envelope.file;
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
    open(text, fileName) {
      const result = parse(text);
      if (!result.ok) {
        emit({ ...state, errors: result.errors });
        return result.errors;
      }
      const { project, snapshotDiffers, changed } = settle(result.project);
      const { savedAt, downloadedAt, recomputedBy, previousResolved, parked } = state;
      const replaced: Replaced = { project: state.project, savedAt, downloadedAt, snapshotDiffers: state.snapshotDiffers, recomputedBy, previousResolved, parked };
      // The file on disk matches what is now here, so it counts as the durable copy (CONTRACTS §1), unless
      // it was resolved on load: then the file is marked as changed (behind).
      const at = now().toISOString();
      emit({
        ...state, project, errors: [], downloadedAt: at, snapshotDiffers, recomputedBy: null, previousResolved: null, parked: null,
        fileVersion: state.fileVersion + 1, replaced, openNotice: { fileName: fileName ?? "the project file", undone: false },
        ...persist(project, at, { savedAt: changed ? after(at, at) : at }),
      });
      return [];
    },
    undoOpen() {
      const r = state.replaced;
      if (r === null || state.openNotice === null) return;
      emit({
        ...state, ...r, errors: [], fileVersion: state.fileVersion + 1, replaced: null, openNotice: { ...state.openNotice, undone: true },
        ...persist(r.project, r.downloadedAt, { savedAt: r.savedAt }),
      });
    },
    replace(project) {
      emit({ ...state, ...EXPIRE, project, errors: [], snapshotDiffers: false, parked: null, fileVersion: state.fileVersion + 1, ...persist(project, state.downloadedAt) });
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
    openDevFixture(text, savedAt, downloadedAt = null) {
      const errors = this.open(text);
      if (errors.length === 0) emit({ ...state, ...EXPIRE, savedAt, downloadedAt });
    },
    keepSnapshot() {
      emit({ ...state, ...EXPIRE, snapshotDiffers: false });
    },
    recomputeSnapshot() {
      const previousResolved = state.project.resolved;
      const project = { ...state.project, resolved: resolveSnapshot(state.project) };
      emit({ ...state, ...EXPIRE, project, snapshotDiffers: false, recomputedBy: null, previousResolved, ...persist(project, state.downloadedAt) });
    },
    undoRecompute() {
      if (state.previousResolved === null) return;
      const project = { ...state.project, resolved: state.previousResolved };
      emit({ ...state, ...EXPIRE, project, snapshotDiffers: true, previousResolved: null, ...persist(project, state.downloadedAt) });
    },
    markDownloaded() {
      // Only the project file is a copy you can reopen. Its text didn't change, so savedAt stays.
      const downloadedAt = state.savedAt === null ? now().toISOString() : later(now().toISOString(), state.savedAt);
      emit({ ...state, downloadedAt, ...persist(state.project, downloadedAt, { savedAt: state.savedAt }) });
    },
  };
}

let browserStore: ProjectStore | null = null;
const serverState: ProjectState = { project: emptyProject(), errors: [], savedAt: null, downloadedAt: null, saveFailed: false, hydrated: false, snapshotDiffers: false, recomputedBy: null, previousResolved: null, parked: null, fileVersion: 0, replaced: null, openNotice: null };

function getBrowserStore(): ProjectStore {
  if (!browserStore) {
    const fixture = devFixtureName(window.location.search);
    if (fixture) {
      // A fixture never touches the real autosave: in-memory store, no storage.
      const store = createProjectStore(null);
      browserStore = store;
      void devFixtureText(fixture).then(({ text, savedAt, downloadedAt }) => store.openDevFixture(text, savedAt, downloadedAt));
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

/** The later of two ISO timestamps (a download is never before the change it saved, even if the clock went back). */
function later(a: string, b: string): string {
  return a >= b ? a : b;
}

export type FileStatus = { kind: "none" } | { kind: "current"; at: string } | { kind: "behind"; since: string };

/** Where the durable copy stands: no project file yet, the file on disk matches, or the project moved on after it. */
export function fileStatus(s: Pick<ProjectState, "savedAt" | "downloadedAt">): FileStatus {
  if (s.downloadedAt === null) return { kind: "none" };
  if (s.savedAt !== null && s.savedAt > s.downloadedAt) return { kind: "behind", since: s.downloadedAt };
  return { kind: "current", at: s.downloadedAt };
}
