import { expect, test } from "vitest";
import { LAW_BY_ID } from "@/content/laws";
import { formatParam, renderRule } from "@/domain/rules";

test("params are filled with their unit, trailing zeros trimmed", () => {
  expect(formatParam(44, "px")).toBe("44px");
  expect(formatParam(400, "ms")).toBe("400 ms");
  expect(formatParam(4.5, "ratio")).toBe("4.5:1");
  expect(formatParam(3.0, "ratio")).toBe("3:1");
  expect(formatParam(0, "count")).toBe("0");
});

test("a law with params renders an imperative rule and its check", () => {
  const rule = renderRule(LAW_BY_ID.get("fitts")!, { minPx: 44 });
  expect(rule.id).toBe("fitts.target-size");
  expect(rule.rule).toBe("Make every interactive element at least 44px by 44px.");
  expect(rule.check).toMatchObject({ kind: "min-target-size", params: { minPx: 44 }, viewports: [390, 1280] });
  expect("question" in rule.check).toBe(false);
});

test("a manual law carries its question and a null selector", () => {
  const rule = renderRule(LAW_BY_ID.get("peak-end")!, {});
  expect(rule.check.selector).toBeNull();
  expect(rule.check.params).toEqual({});
  expect(rule.check.question).toMatch(/\?$/);
});
