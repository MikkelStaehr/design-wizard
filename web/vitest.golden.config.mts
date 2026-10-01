// `pnpm golden` only: regenerates the contract goldens on purpose. Normal test runs never write them.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/contract/write-goldens.ts"],
    environment: "node",
  },
});
