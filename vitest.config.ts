import { defineConfig, configDefaults } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    // Ignoring .claude/worktrees/ in git is not enough: vitest walks the filesystem,
    // not the index. An agent worktree there is a complete second copy of the repo, so
    // every test file is collected twice and the run reports doubled counts (245
    // instead of 123) while quietly executing another branch's tests alongside this
    // one. Spread the defaults rather than replacing them, or node_modules comes back.
    exclude: [...configDefaults.exclude, "**/.claude/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
