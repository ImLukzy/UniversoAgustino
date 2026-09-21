import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Solo lógica pura (lib/): los tests de componentes llegarán con jsdom.
    environment: "node",
    include: ["src/lib/**/*.test.ts"],
    testTimeout: 15000,
  },
});
