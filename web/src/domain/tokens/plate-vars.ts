// Owner of plate tokens → `--v-*` custom properties (docs/CONTRACTS.md §6).
// Sample components read only these; the plate root sets them inline.
import { COLOR_ROLES, FONT_SIZE_KEYS, SPACE_KEYS } from "@/contracts/project";
import { variantFace } from "@/content/fonts";
import type { PlateTokens } from "./resolve";

export function plateVars(t: PlateTokens): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const role of COLOR_ROLES) vars[`--v-${role}`] = t.color.light[role];
  vars["--v-font-display"] = `"${variantFace(t.font.display.catalogueId)}", ${t.font.display.generic}`;
  vars["--v-font-text"] = `"${variantFace(t.font.text.catalogueId)}", ${t.font.text.generic}`;
  vars["--v-weight-display"] = String(t.font.display.weights[0]);
  vars["--v-weight-text"] = String(t.font.text.weights[0]);
  vars["--v-weight-strong"] = String(t.font.text.weights[t.font.text.weights.length - 1]);
  for (const k of FONT_SIZE_KEYS) vars[`--v-fs-${k}`] = `${t.fontSize[k]}rem`;
  vars["--v-lh-text"] = String(t.lineHeight.text);
  vars["--v-lh-display"] = String(t.lineHeight.display);
  for (const k of SPACE_KEYS) vars[`--v-space-${k}`] = `${t.space[k]}px`;
  vars["--v-radius"] = `${t.radius}px`;
  return vars;
}
