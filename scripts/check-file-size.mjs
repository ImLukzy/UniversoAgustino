// F0: presupuesto de tamaño por página. Falla si alguna página supera el
// máximo (ratchet: bajar el MAX a medida que se parte cada monolito).
// Uso: node scripts/check-file-size.mjs [--max=700]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url)) + "/..";
const arg = process.argv.find((a) => a.startsWith("--max="));
const MAX = arg ? Number(arg.split("=")[1]) : 700;

const dir = path.join(root, "apps/web/src/pages");
let fail = 0;
const rows = [];
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith(".tsx")) continue;
  const n = fs.readFileSync(path.join(dir, f), "utf8").split("\n").length;
  rows.push([f, n]);
  if (n > MAX) {
    console.error(`EXCEDE ${f}: ${n} líneas (máx ${MAX})`);
    fail = 1;
  }
}
rows.sort((a, b) => b[1] - a[1]);
console.log(rows.map(([f, n]) => `${String(n).padStart(4)}  ${f}`).join("\n"));
process.exit(fail);
