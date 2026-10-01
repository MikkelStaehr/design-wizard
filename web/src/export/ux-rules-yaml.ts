// ux-rules.yaml v1 (docs/CONTRACTS.md §3), written by our own emitter for byte control.
// Strings are double-quoted with JSON escaping (valid YAML 1.2); numbers are bare.
import type { ProjectFile } from "@/contracts/project";
import type { Rule } from "@/contracts/rules";
import { requireResolved } from "./tokens-json";

const q = (s: string) => JSON.stringify(s);

function ruleLines(r: Rule): string[] {
  const { kind, selector, params, viewports, question } = r.check;
  const lines = [
    `  - id: ${q(r.id)}`,
    `    law: ${q(r.law)}`,
    `    when: ${q(r.when)}`,
    `    rule: ${q(r.rule)}`,
    `    severity: ${q(r.severity)}`,
    "    check:",
    `      kind: ${q(kind)}`,
    `      selector: ${selector === null ? "null" : q(selector)}`,
  ];
  const entries = Object.entries(params);
  if (entries.length === 0) lines.push("      params: {}");
  else lines.push("      params:", ...entries.map(([k, v]) => `        ${k}: ${v}`));
  lines.push(`      viewports: [${viewports.join(", ")}]`);
  if (kind === "manual" && question !== undefined) lines.push(`      question: ${q(question)}`);
  return lines;
}

export function uxRulesYaml(p: ProjectFile): string {
  const r = requireResolved(p);
  const head = ["schemaVersion: 1", `project: ${q(r.name)}`];
  const body = r.rules.length === 0 ? ["rules: []"] : ["rules:", ...r.rules.flatMap(ruleLines)];
  return `${[...head, ...body].join("\n")}\n`;
}
