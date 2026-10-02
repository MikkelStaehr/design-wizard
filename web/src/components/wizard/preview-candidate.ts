"use client";
import { useSyncExternalStore } from "react";
import type { Visual } from "@/contracts/project";
import type { VisualKey } from "@/domain/decisions";

/**
 * The variant selected in a PlateGrid but not yet chosen, so the preview column can show it on top
 * of the decisions made so far. UI state only: never persisted and never in the project store.
 */
export type PreviewCandidate = {
  [K in VisualKey]: { key: K; value: NonNullable<Visual[K]> };
}[VisualKey];

let current: PreviewCandidate | null = null;
const listeners = new Set<() => void>();

export function setPreviewCandidate(next: PreviewCandidate | null) {
  if (next === current || (next !== null && current !== null && next.key === current.key && next.value === current.value)) return;
  current = next;
  for (const l of listeners) l();
}

/** Clears the candidate only if it is still `key`'s, so an unmounting grid never clears its successor's. */
export function clearPreviewCandidate(key?: PreviewCandidate["key"]) {
  if (current !== null && (key === undefined || current.key === key)) setPreviewCandidate(null);
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function usePreviewCandidate(): PreviewCandidate | null {
  return useSyncExternalStore(subscribe, () => current, () => null);
}
