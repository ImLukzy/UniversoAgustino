// F4-05: verifica que cada ruta montada en Express exista en docs/openapi.yaml.
// Uso: node scripts/docs-check.mjs  (exit 1 si falta alguna)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url)) + "/..";
const api = path.join(root, "apps/api/src");

// archivo fuente -> prefijos de montaje
const SOURCES = [
  ["app.ts", [""]],
  ["modules/auth/routes.ts", ["/auth"]],
  ["modules/auth/oauth.ts", ["/auth/oauth"]],
  ["modules/documents/routes.ts", ["/documents"]],
  ["modules/bazar/routes.ts", ["/bazar"]],
  ["modules/orders/routes.ts", ["/orders"]],
  ["modules/extra/routes.ts", ["/monetization", "/reports"]],
  ["modules/uploads/routes.ts", ["/uploads"]],
  ["modules/payments/routes.ts", ["/payments"]],
  ["modules/staff/routes.ts", ["/staff"]],
  ["modules/staff/reviews.ts", ["/staff/reviews"]],
  ["modules/staff/sedes.ts", ["/staff/sedes"]],
  ["modules/staff/schedule.ts", ["/staff/schedule"]],
  ["modules/staff/shifts.ts", ["/staff/shifts"]],
  ["modules/cases/routes.ts", ["/staff/cases"]],
  ["modules/cases/queries.ts", ["/staff/cases", "/cases"]],
  ["modules/sedes/routes.ts", ["/sedes"]],
  ["modules/notifications/routes.ts", []],
  ["server.ts", [""]],
];

// Los módulos registran rutas mediante helpers que reciben el router padre.
for (const [dir, prefix] of [["auth", "/auth"], ["auth/oauth", "/auth/oauth"], ["documents", "/documents"], ["orders", "/orders"]]) {
  for (const file of fs.readdirSync(path.join(api, "modules", dir))) {
    if (!file.endsWith(".ts") || file.endsWith(".test.ts")) continue;
    const source = `modules/${dir}/${file}`;
    if (!SOURCES.some(([existing]) => existing === source)) SOURCES.push([source, [prefix]]);
  }
}
const ROUTE_RE = /(\w+)\.(get|post|patch|delete|put)\(\s*["'`]([^'"`]+)["'`]/g;
// router variable -> prefijo (extra/routes.ts tiene dos routers en un archivo)
const ROUTER_PREFIX = {
  r: [""],
  app: [""],
  router: null, // se resuelve por archivo (abajo)
  authRouter: ["/auth"],
  oauthRouter: ["/auth/oauth"],
  documentsRouter: ["/documents"],
  bazarRouter: ["/bazar"],
  ordersRouter: ["/orders"],
  monetizationRouter: ["/monetization"],
  reportsRouter: ["/reports"],
  uploadsRouter: ["/uploads"],
  paymentsRouter: ["/payments"],
  staffRouter: ["/staff"],
  reviewsRouter: ["/staff/reviews"],
  staffSedesRouter: ["/staff/sedes"],
  scheduleRouter: ["/staff/schedule"],
  shiftsRouter: ["/staff/shifts"],
  casesRouter: ["/staff/cases"],
  participantCasesRouter: ["/cases"],
  sedesRouter: ["/sedes"],
  notificationsRouter: ["/notifications"],
};
const found = new Set();
for (const [file, fallback] of SOURCES) {
  const text = fs.readFileSync(path.join(api, file), "utf8");
  for (const m of text.matchAll(ROUTE_RE)) {
    const prefixes = m[1] === "router" ? fallback : ROUTER_PREFIX[m[1]];
    if (!prefixes) continue;
    const sub = m[3].split("?")[0];
    for (const pre of prefixes) {
      const full = pre + (sub === "/" ? "" : sub);
      if (!full || full === "/docs") continue;
      found.add(full.replace(/:([A-Za-z_]+)/g, "{$1}"));
    }
  }
}

// Rutas del YAML (nivel `paths:`)
const yaml = fs.readFileSync(path.join(root, "apps/api/docs/openapi.yaml"), "utf8");
const inPaths = yaml.slice(yaml.indexOf("\npaths:"));
const documented = new Set(
  [...inPaths.matchAll(/^ {2}(\/[A-Za-z0-9/_{}().-]+):/gm)].map((m) => m[1]),
);

let fail = 0;
for (const r of [...found].sort()) {
  if (!documented.has(r)) {
    console.error("FALTA en openapi.yaml:", r);
    fail = 1;
  }
}
for (const d of [...documented].sort()) {
  if (!found.has(d)) console.log("aviso: documentada pero no montada:", d);
}
console.log(fail ? "docs:check FALLIDO" : `docs:check OK (${found.size} rutas cubiertas)`);
process.exit(fail);
