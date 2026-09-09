import fs from "node:fs";
const dir = "C:\\Users\\anton\\OneDrive\\Documentos\\Unsa\\enfermeria-hub\\apps\\web\\src\\stitch";
const [,, file] = process.argv;
const c = fs.readFileSync(`${dir}/${file}`, "utf8");
console.log("=== data-stitch handlers ===");
for (const m of c.matchAll(/data-stitch-on\w+="[^"]*"/g)) console.log(" " + m[0]);
console.log("=== key ids context ===");
const ids = ["total-net-earnings","metric-gross","metric-fee","metric-net-sub","platform-fee-label",
  "projection-narrative","equip-equiv-1","equip-equiv-2","step-content-1","step-content-2","step-content-3",
  "step-tab-1","step-tab-2","step-tab-3","upload-wizard-form","upload-success-state","legal-check","yape-check",
  "price-slider","sales-slider","price-val-badge","sales-val-badge","fee-explanation"];
for (const id of ids) {
  const i = c.indexOf(`id="${id}"`);
  if (i < 0) { console.log(id + ": MISSING"); continue; }
  const s = c.lastIndexOf("<", i);
  console.log(id + ": " + JSON.stringify(c.slice(s, s + 260)));
}
