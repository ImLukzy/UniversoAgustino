import process from "node:process";
import { spawnSync } from "node:child_process";

for (const spec of ["landing.mjs", "spec45.mjs", "spec46.mjs", "pagos-digital.mjs", "reembolso-digital.mjs", "sede-cobro.mjs"]) {
  const result = spawnSync(process.execPath, [`tests/e2e/${spec}`], { stdio: "inherit", env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
globalThis.console.log("✓ E2E portada y specs 45, 46, 51 y 55 completadas");
