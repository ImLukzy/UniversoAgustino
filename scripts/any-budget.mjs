// F0: ratchet de `any`. Falla si el conteo sube respecto a .any-budget.
// Uso: node scripts/any-budget.mjs --check | --update
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url)) + "/..";
const DIRS = ["apps/web/src", "apps/api/src", "packages/shared/src"].map((d) => path.join(root, d));
const BUDGET_FILE = path.join(root, ".any-budget");

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (/\.(ts|tsx)$/.test(e.name)) yield p;
  }
}

let count = 0;
for (const d of DIRS) {
  for (const f of walk(d)) {
    const m = fs.readFileSync(f, "utf8").match(/\bany\b/g);
    if (m) count += m.length;
  }
}

const mode = process.argv[2] || "--check";
if (mode === "--update") {
  fs.writeFileSync(BUDGET_FILE, String(count) + "\n");
  console.log(`any-budget actualizado: ${count}`);
  process.exit(0);
}
let budget = Number.NaN;
try {
  budget = Number(fs.readFileSync(BUDGET_FILE, "utf8").trim());
} catch {
  console.log(`sin .any-budget previo; actual=${count} (corre --update para fijarlo)`);
  process.exit(0);
}
if (count > budget) {
  console.error(`any-budget EXCEDIDO: ${count} > ${budget}`);
  process.exit(1);
}
console.log(`any-budget OK: ${count} <= ${budget}`);
