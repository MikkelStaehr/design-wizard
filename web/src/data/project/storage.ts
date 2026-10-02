// localStorage envelope (docs/CONTRACTS.md §1). Storage is passed in so tests need no DOM.
// A stored file that no longer parses is moved to quarantine, never dropped.
import type { ParseError } from "@/contracts/errors";
import type { ProjectFile } from "@/contracts/project";
import { parse } from "./parse";

export const STORAGE_KEY = "design-wizard:v1:project";
export const QUARANTINE_KEY = "design-wizard:v1:quarantine";

export interface Envelope {
  savedAt: string;
  downloadedAt: string | null;
  file: string;
}

export type Restored =
  | { kind: "none" }
  | { kind: "restored"; project: ProjectFile; envelope: Envelope }
  | { kind: "quarantined"; errors: ParseError[] };

export function save(storage: Storage, file: string, savedAt: string, downloadedAt: string | null): Envelope {
  const envelope: Envelope = { savedAt, downloadedAt, file };
  storage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  return envelope;
}

export function restore(storage: Storage): Restored {
  const text = storage.getItem(STORAGE_KEY);
  if (text === null) return { kind: "none" };
  let envelope: Envelope | null = null;
  try {
    const raw: unknown = JSON.parse(text);
    const e = raw as Partial<Envelope> | null;
    const isEnvelope =
      typeof e === "object" && e !== null && typeof e.file === "string" && typeof e.savedAt === "string" &&
      (e.downloadedAt === null || typeof e.downloadedAt === "string");
    if (isEnvelope) envelope = e as Envelope;
  } catch {
    envelope = null;
  }
  const result = envelope ? parse(envelope.file) : null;
  if (envelope && result?.ok) return { kind: "restored", project: result.project, envelope };

  storage.setItem(QUARANTINE_KEY, text);
  storage.removeItem(STORAGE_KEY);
  const errors: ParseError[] = result && !result.ok
    ? result.errors
    : [{ path: "", code: "json-syntax", message: "The saved copy in this browser is damaged. It was kept aside; open your downloaded project file instead." }];
  return { kind: "quarantined", errors };
}
