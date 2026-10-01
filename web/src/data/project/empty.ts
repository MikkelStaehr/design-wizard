import { FORMAT, SCHEMA_VERSION, type ProjectFile } from "@/contracts/project";

/** A new project: every decision open (null). componentLibrary starts at the user's default target, shadcn. */
export function emptyProject(): ProjectFile {
  return {
    schemaVersion: SCHEMA_VERSION,
    format: FORMAT,
    profile: { name: null, productType: null, platform: null, notes: "", componentLibrary: "shadcn" },
    principles: null,
    visual: {
      fontPair: null,
      spacingBase: null,
      radius: null,
      density: null,
      brandHex: null,
      paletteVariant: null,
      colorOverrides: {},
    },
    resolved: null,
  };
}
