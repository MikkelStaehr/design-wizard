// Owner of density → type scale + line heights, and spacing base → space scale.
import { FONT_SIZE_KEYS, SPACE_KEYS, type Density, type FontSizeKey, type Resolved, type SpaceKey } from "@/contracts/project";

/** px per step xs … 3xl; stored as rem (÷16, at most 4 decimals). */
export const DENSITY_SCALES: Record<Density, { px: readonly number[]; lineHeight: Resolved["lineHeight"] }> = {
  compact: { px: [11, 12, 13, 15, 20, 25, 32], lineHeight: { text: 1.5, display: 1.2 } },
  balanced: { px: [12, 13, 14, 16, 20, 28, 36], lineHeight: { text: 1.55, display: 1.2 } },
  airy: { px: [12, 14, 16, 18, 24, 32, 40], lineHeight: { text: 1.6, display: 1.25 } },
};

const rem = (px: number) => Math.round((px / 16) * 10000) / 10000;

export function typeScale(density: Density): Pick<Resolved, "fontSize" | "lineHeight"> {
  const { px, lineHeight } = DENSITY_SCALES[density];
  const fontSize = Object.fromEntries(FONT_SIZE_KEYS.map((k, i) => [k, rem(px[i])])) as Record<FontSizeKey, number>;
  return { fontSize, lineHeight: { ...lineHeight } };
}

export function spaceScale(base: number): Record<SpaceKey, number> {
  return Object.fromEntries(SPACE_KEYS.map((k) => [k, Number(k) * base])) as Record<SpaceKey, number>;
}
