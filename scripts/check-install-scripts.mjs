#!/usr/bin/env node
// Falla si alguna dependencia tiene scripts de instalación sin revisar en
// `allowScripts` (npm los omite en silencio). Al subir una versión fijada,
// revisarla y aprobarla con `npm install-scripts approve <pkg>`.
import { spawnSync } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const r = spawnSync(npm, ["install-scripts", "ls"], { encoding: "utf8" });
const out = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim();
if (r.status !== 0 || !out.includes("No packages with unreviewed install scripts")) {
  console.error(out || "npm install-scripts ls falló");
  console.error("Hay scripts de instalación sin revisar: apruébalos o deniégalos en allowScripts.");
  process.exit(1);
}
