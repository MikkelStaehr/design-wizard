// Owner of hex parsing and normalisation (docs/ARCHITECTURE.md §4).
import type { Hex } from "@/contracts/project";

const FILE_HEX = /^#[0-9a-fA-F]{6}$/;

/** File input: exactly `#RRGGBB` in either case → upper case, otherwise null. */
export function normalizeHex(value: string): Hex | null {
  return FILE_HEX.test(value) ? value.toUpperCase() : null;
}

/** Channels 0–255 of a normalised hex. */
export function hexToRgb(hex: Hex): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}
