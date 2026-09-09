import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const theme = JSON.parse(fs.readFileSync(path.join(here, "stitch-theme.json"), "utf8"));

const out = `/** @type {import('tailwindcss').Config} */
// Tokens Stitch 1:1 — generados desde scripts/stitch-theme.json
// (origen: stitch_enfermer_ahub_arequipa_marketplace + modern_clinical_warmth/DESIGN.md).
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: ${JSON.stringify(theme, null, 2)} },
  plugins: [],
};
`;
fs.writeFileSync(path.join(here, "..", "apps", "web", "tailwind.config.js"), out);
console.log("tailwind.config.js OK");
