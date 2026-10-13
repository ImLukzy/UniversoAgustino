#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const steps = [
  ["build shared", npm, ["run", "build", "-w", "packages/shared"]],
  ["prisma generate", "./node_modules/.bin/prisma", ["generate", "--schema", "apps/api/prisma/schema.prisma"]],
  ["typecheck", npm, ["run", "typecheck"]],
  ["lint", npm, ["run", "lint"]],
  ["docs:check", npm, ["run", "docs:check"]],
  ["secrets", npm, ["run", "secrets"]],
  ["budget:any", npm, ["run", "budget:any"]],
  ["budget:size", npm, ["run", "budget:size"]],
  ["subset-icons", process.execPath, ["scripts/subset-icons.mjs", "--check"]],
  ["install-scripts", process.execPath, ["scripts/check-install-scripts.mjs"]],
  ["test", npm, ["test"]],
];

for (const [name, command, args] of steps) {
  const startedAt = Date.now();
  const env = { ...process.env };
  if (name === "test") {
    env.JWT_ACCESS_SECRET ??= "ci-only-fictitious-access-key-for-tests";
    env.JWT_REFRESH_SECRET ??= "ci-only-fictitious-refresh-key-for-tests";
  }
  const result = spawnSync(command, args, { cwd: root, env, encoding: "utf8" });
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    if (result.error) console.error(result.error.message);
    console.error(`✗ ${name} (${elapsed}s)`);
    process.exitCode = result.status ?? 1;
    break;
  }
  console.log(`✓ ${name} (${elapsed}s)`);
}
