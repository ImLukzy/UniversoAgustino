import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Tests de src con renderizado de servidor, sin servicios externos.
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    testTimeout: 15000,
  },
});
