// ?fixture=empty|harbour|stale|invalid-many (development builds only), so every state can be
// screenshotted without touching the real autosave. The store for a fixture never writes storage.
import { emptyProject } from "./empty";
import { serialize } from "./serialize";

export const DEV_FIXTURES = ["empty", "harbour", "stale", "invalid-many"] as const;
export type DevFixture = (typeof DEV_FIXTURES)[number];

export function devFixtureName(search: string): DevFixture | null {
  if (process.env.NODE_ENV !== "development") return null;
  const name = new URLSearchParams(search).get("fixture");
  return (DEV_FIXTURES as readonly string[]).includes(name ?? "") ? (name as DevFixture) : null;
}

/** File text for a fixture, plus a fixed savedAt for "stale" (an autosave a week old, never downloaded). */
export async function devFixtureText(name: DevFixture): Promise<{ text: string; savedAt: string | null }> {
  switch (name) {
    case "empty":
      return { text: serialize(emptyProject()), savedAt: null };
    case "harbour":
      return { text: JSON.stringify((await import("../../../fixtures/harbour.project.json")).default, null, 2), savedAt: null };
    case "stale":
      return {
        text: JSON.stringify((await import("../../../fixtures/harbour.project.json")).default, null, 2),
        savedAt: "2026-09-24T09:00:00.000Z",
      };
    case "invalid-many":
      return { text: JSON.stringify((await import("../../../fixtures/invalid-many.project.json")).default, null, 2), savedAt: null };
  }
}
