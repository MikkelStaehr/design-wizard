// AC4 (static half): sample components read only --v-* custom properties, no colour literals, no font names.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

const DIR = join(__dirname, "..", "..", "src", "components", "samples");
const files = readdirSync(DIR).map((f) => [f, readFileSync(join(DIR, f), "utf8")] as const);

test.each(files)("%s reads only --v-* variables and has no colour or font literals", (_, src) => {
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  expect([...code.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]).filter((v) => !v.startsWith("--v-"))).toEqual([]);
  expect(code.match(/#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(|\boklch\(/gi)).toBeNull();
  expect(code.match(/font-family:(?!\s*var\(--v-)/g)).toBeNull();
  expect(code.match(/style=\{/g)).toBeNull();
});
