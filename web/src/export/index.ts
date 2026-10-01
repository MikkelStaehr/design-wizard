// The three exports. The fourth download, `<slug>.dwproj.json`, comes from data/project/serialize:
// exporters may not import the data layer (docs/ARCHITECTURE.md §3), so the export step adds it.
import type { ProjectFile } from "@/contracts/project";
import { slug } from "@/lib/slug";
import { designMd } from "./design-md";
import { tokensJson } from "./tokens-json";
import { uxRulesYaml } from "./ux-rules-yaml";

export interface ExportFiles {
  "DESIGN.md": string;
  "tokens.json": string;
  "ux-rules.yaml": string;
}

export function exportAll(p: ProjectFile): ExportFiles {
  return { "DESIGN.md": designMd(p), "tokens.json": tokensJson(p), "ux-rules.yaml": uxRulesYaml(p) };
}

export function projectFileName(p: ProjectFile): string {
  return `${slug(p.profile.name ?? "")}.dwproj.json`;
}
