import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "zustand-mutable": fileURLToPath(
        new URL("./src/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    name: "zustand-mutable",
    globals: true,
    environment: "happy-dom",
    dir: "tests",
    reporters: process.env.GITHUB_ACTIONS
      ? ["default", "github-actions"]
      : ["default"],
    setupFiles: ["tests/setup.ts"],
    coverage: {
      include: ["src/**/"],
      reporter: ["text", "json", "html", "text-summary"],
      reportsDirectory: "./coverage/",
      provider: "v8",
    },
  },
});
