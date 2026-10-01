// Owner of law + params → rendered rule (docs/ARCHITECTURE.md §4).
import type { LawEntry, ParamUnit } from "@/contracts/content";
import type { Rule } from "@/contracts/rules";

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

export function renderRule(law: LawEntry, params: Record<string, number>): Rule {
  const text = law.rule.template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const param = law.params.find((p) => p.key === key);
    const value = params[key];
    if (!param || value === undefined) throw new Error(`Law ${law.id}: no value for {${key}}`);
    return formatParam(value, param.unit);
  });
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
