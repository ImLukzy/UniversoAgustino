import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Carga .env ANTES de leer process.env (los imports ESM se hoistean,
// por eso debe vivir aquí y no en server.ts).
const here = path.dirname(fileURLToPath(import.meta.url));
for (const p of [path.join(here, "../.env"), path.join(here, "../../.env"), path.join(here, "../../../.env")]) {
  dotenv.config({ path: p });
}

const str = (name: string, min = 32) => {
  const v = process.env[name] ?? "";
  if (v.length < min) throw new Error(`${name} debe tener al menos ${min} caracteres (revisa .env)`);
  return v;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.API_PORT ?? 4000),
  PREFIX: process.env.API_PREFIX ?? "/api/v1",
  WEB_ORIGIN: (process.env.WEB_ORIGIN ?? "http://localhost:5173").split(","),
  JWT_ACCESS_SECRET: str("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: str("JWT_REFRESH_SECRET"),
  // Runbook de rotación (docs/runbook-rotacion.md): durante la ventana de gracia
  // la API acepta el secreto nuevo y el previo. Vacíos = sin rotación en curso.
  JWT_ACCESS_SECRET_PREV: process.env.JWT_ACCESS_SECRET_PREV ?? "",
  JWT_REFRESH_SECRET_PREV: process.env.JWT_REFRESH_SECRET_PREV ?? "",
  JWT_ACCESS_TTL: process.env.JWT_ACCESS_TTL ?? "15m",
  JWT_REFRESH_TTL: process.env.JWT_REFRESH_TTL ?? "7d",
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  FEE_PCT: Number(process.env.PLATFORM_FEE_PCT ?? 13),
  // Sprint 1A: TTL de reservas PENDING (minutos) y flags del job de expiración.
  RESERVATION_TTL_MINUTES: Number(process.env.RESERVATION_TTL_MINUTES ?? 30),
  DIRECT_DATABASE_URL: process.env.DIRECT_DATABASE_URL ?? "",
  ENABLE_JOBS: process.env.ENABLE_JOBS ?? "false",
};

// Sprint 4 (F4-03): la API se niega a arrancar en producción con secretos
// de plantilla. En development/test solo avisa (para no bloquear el flujo
// local con .env de ejemplo).
const PLACEHOLDER = /cambia-este|changeme|your-secret|secret123/i;
function assertProdSecrets(): void {
  if (env.NODE_ENV !== "production") return;
  for (const key of ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"] as const) {
    if (PLACEHOLDER.test(env[key])) {
      throw new Error(`${key} conserva un valor de plantilla. Rota el secreto antes de desplegar (ver docs/runbook-rotacion.md).`);
    }
  }
  if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_ACCESS_SECRET y JWT_REFRESH_SECRET deben ser distintos.");
  }
  if (env.DIRECT_DATABASE_URL && PLACEHOLDER.test(env.DIRECT_DATABASE_URL)) {
    throw new Error("DIRECT_DATABASE_URL conserva un valor de plantilla.");
  }
}
assertProdSecrets();
