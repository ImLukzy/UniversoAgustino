import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Lógica y sesión con renderizado de servidor, sin servicios externos.
    environment: "node",
    include: ["src/lib/**/*.test.ts", "src/auth/**/*.test.ts", "src/auth/**/*.test.tsx"],
    testTimeout: 15000,
  },
});
