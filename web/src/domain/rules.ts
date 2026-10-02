// Owner of law + params → rendered rule (docs/ARCHITECTURE.md §4).
import type { LawEntry, ParamUnit } from "@/contracts/content";
import type { Principle } from "@/contracts/project";
import type { Rule } from "@/contracts/rules";
import { LAW_BY_ID } from "@/content/laws";

/** Up to 2 decimals with trailing zeros trimmed, then the unit: 44px, 400 ms, 1, 4.5:1. */
export function formatParam(value: number, unit: ParamUnit): string {
  const n = String(Math.round(value * 100) / 100);
  switch (unit) {
    case "px":
      return `${n}px`;
    case "ms":
      return `${n} ms`;
    case "ratio":
      return `${n}:1`;
    case "count":
      return n;
  }
}

/** The rule sentence as parts: plain text, and each filled param (so the UI can emphasise it). Joined, it is the exported rule. */
export function ruleParts(law: LawEntry, params: Record<string, number>): { text: string; param: boolean }[] {
  return law.rule.template.split(/\{(\w+)\}/).map((part, i) => {
    if (i % 2 === 0) return { text: part, param: false };
    const param = law.params.find((p) => p.key === part);
    const value = params[part];
    if (!param || value === undefined) throw new Error(`Law ${law.id}: no value for {${part}}`);
    return { text: formatParam(value, param.unit), param: true };
  });
}

export function renderRule(law: LawEntry, params: Record<string, number>): Rule {
  const text = ruleParts(law, params).map((p) => p.text).join("");
  const { kind, selector, viewports, question } = law.rule.check;
  // Key order is the contract order (docs/CONTRACTS.md §3).
  const checkParams: Record<string, number> = {};
  for (const p of law.params) checkParams[p.key] = params[p.key];
  return {
    id: `${law.id}.${law.rule.key}`,
    law: law.id,
    when: law.when,
    rule: text,
    severity: law.rule.severity,
    check: {
      kind,
      selector,
      params: checkParams,
      viewports: [...viewports],
      ...(kind === "manual" ? { question } : {}),
    },
  };
}

/** "4 RULES · 3 MUST · 1 SHOULD", "NO RULES YET", "NO RULES · DECIDED": the laws step's and the export's count line. */
export function countLine(principles: Principle[] | null): string {
  if (principles === null) return "NO RULES YET";
  if (principles.length === 0) return "NO RULES · DECIDED";
  const n = principles.length;
  if (n === 1) return "1 RULE";
  const must = principles.filter((p) => LAW_BY_ID.get(p.lawId)?.rule.severity === "must").length;
  const head = `${n} RULES`;
  if (must === n) return `${head} · ALL MUST`;
  if (must === 0) return `${head} · ALL SHOULD`;
  return `${head} · ${must} MUST · ${n - must} SHOULD`;
}
