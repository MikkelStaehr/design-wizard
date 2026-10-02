// ?fixture=<name> (development builds only), so every state can be
// screenshotted without touching the real autosave. The store for a fixture never writes storage.
import { emptyProject } from "./empty";
import { serialize } from "./serialize";

export const DEV_FIXTURES = ["empty", "harbour", "stale", "invalid-many", "zero-laws", "behind", "edge-name", "snapshot-differs", "ready"] as const;
export type DevFixture = (typeof DEV_FIXTURES)[number];

export function devFixtureName(search: string): DevFixture | null {
  if (process.env.NODE_ENV !== "development") return null;
  const name = new URLSearchParams(search).get("fixture");
  return (DEV_FIXTURES as readonly string[]).includes(name ?? "") ? (name as DevFixture) : null;
}

const local = (month: number, day: number, h: number, m: number) => new Date(2026, month - 1, day, h, m).toISOString();
const harbourText = async () => JSON.stringify((await import("../../../fixtures/harbour.project.json")).default, null, 2);

/**
 * File text for a fixture, plus fixed times: "stale" is an autosave a week old, never downloaded; "behind" was
 * downloaded at 1 Oct 14:32 and changed at 2 Oct 09:10. "snapshot-differs" stores one colour and one size off.
 */
export async function devFixtureText(name: DevFixture): Promise<{ text: string; savedAt: string | null; downloadedAt?: string | null }> {
  switch (name) {
    case "ready": {
      // Harbour's stored colours predate the palette algorithm, so it shows "Stored values differ". Without a
      // stored snapshot the store resolves a fresh one: the clean ready state.
      const p = structuredClone((await import("../../../fixtures/harbour.project.json")).default) as Record<string, unknown>;
      p.resolved = null;
      return { text: JSON.stringify(p, null, 2), savedAt: null };
    }
    case "behind":
      return { text: await harbourText(), savedAt: local(10, 2, 9, 10), downloadedAt: local(10, 1, 14, 32) };
    case "edge-name":
      return { text: JSON.stringify((await import("../../../fixtures/edge-name.project.json")).default, null, 2), savedAt: null };
    case "snapshot-differs": {
      const p = structuredClone((await import("../../../fixtures/harbour.project.json")).default);
      p.resolved.color.light.text = "#1a1a1a";
      p.resolved.fontSize.base = 0.875;
      return { text: JSON.stringify(p, null, 2), savedAt: null };
    }
    case "empty":
      return { text: serialize(emptyProject()), savedAt: null };
    case "harbour":
      return { text: JSON.stringify((await import("../../../fixtures/harbour.project.json")).default, null, 2), savedAt: null };
    case "stale":
      return {
        text: JSON.stringify((await import("../../../fixtures/harbour.project.json")).default, null, 2),
        savedAt: "2026-09-24T09:00:00.000Z",
      };
    case "zero-laws":
      return { text: JSON.stringify((await import("../../../fixtures/edge-zero-laws.project.json")).default, null, 2), savedAt: null };
    case "invalid-many":
      return { text: JSON.stringify((await import("../../../fixtures/invalid-many.project.json")).default, null, 2), savedAt: null };
  }
}
