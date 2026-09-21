import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    testTimeout: 15000,
    // Los tests de integración con BD viven en src/**/*.int.test.ts y se
    // ejecutan solo con TEST_DATABASE_URL (CI con servicio postgres).
    exclude: ["**/node_modules/**", "**/dist/**", "src/**/*.int.test.ts"],
  },
});
