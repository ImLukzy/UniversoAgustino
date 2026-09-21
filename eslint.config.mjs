// F0-01: lint unificado (flat config, ESLint 9).
// Empieza en verde sobre el código actual: reglas duras solo donde no hay
// deuda (hooks), el resto en warn con ratchet (F2-07 sube `any` a error).
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/*.min.js",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    languageOptions: { globals: globals.browser },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/aria-props": "warn",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "off", // F2-07: requiere typed linting (projectService)
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["apps/api/**/*.ts", "packages/shared/**/*.ts", "scripts/**/*.mjs"],
    languageOptions: { globals: globals.node },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "off", // F2-07: requiere typed linting (projectService)
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
    },
  },
  {
    files: ["apps/api/**/*.ts", "packages/shared/**/*.ts", "apps/web/src/**/*.{ts,tsx}"],
    // seed.ts y vitest.config.ts viven fuera de los "include" de cada
    // tsconfig: se lintan sin tipos (sin no-floating-promises).
    ignores: [
      "apps/api/prisma/seed.ts",
      "apps/api/vitest.config.ts",
      "packages/shared/vitest.config.ts",
      "apps/web/vitest.config.ts",
    ],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
    },
  },
);
