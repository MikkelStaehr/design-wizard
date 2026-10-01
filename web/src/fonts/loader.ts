// Variant font loading (docs/PLAN.md, decision on fonts): committed OFL woff2 files under
// /fonts/<id>/, registered with the FontFace API as "dwv-<id>" only when a plate needs them.
// A face that fails is reported as failed (the plate says so instead of showing a fallback font)
// and forgotten, so the next mount tries again.
import type { FontPairEntry } from "@/contracts/content";
import { FONT_BY_ID, variantFace } from "@/content/fonts";

export type FontLoadState = "loading" | "loaded" | "failed";

const faces = new Map<string, Promise<boolean>>();

function loadFace(fontId: string, weight: number): Promise<boolean> {
  const key = `${fontId}:${weight}`;
  const cached = faces.get(key);
  if (cached) return cached;
  const entry = FONT_BY_ID.get(fontId);
  const file = entry?.files.find((f) => f.weight === weight);
  const promise =
    !entry || !file
      ? Promise.resolve(false)
      : (() => {
          const face = new FontFace(variantFace(fontId), `url(/fonts/${fontId}/${file.file}) format("woff2")`, {
            weight: String(weight),
            style: "normal",
            display: "block",
          });
          document.fonts.add(face);
          return face.load().then(
            () => true,
            () => {
              // Forget the failure so a remount retries; the plate shows "Font failed" meanwhile.
              document.fonts.delete(face);
              faces.delete(key);
              return false;
            },
          );
        })();
  faces.set(key, promise);
  return promise;
}

/** Loads every face a pair uses. Resolves "failed" if any face fails. */
export async function loadPair(pair: FontPairEntry): Promise<Exclude<FontLoadState, "loading">> {
  const all = [
    ...pair.display.weights.map((w) => loadFace(pair.display.font, w)),
    ...pair.text.weights.map((w) => loadFace(pair.text.font, w)),
  ];
  const results = await Promise.all(all);
  return results.every(Boolean) ? "loaded" : "failed";
}
