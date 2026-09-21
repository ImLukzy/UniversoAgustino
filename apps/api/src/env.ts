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
  JWT_ACCESS_TTL: process.env.JWT_ACCESS_TTL ?? "15m",
  JWT_REFRESH_TTL: process.env.JWT_REFRESH_TTL ?? "7d",
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  FEE_PCT: Number(process.env.PLATFORM_FEE_PCT ?? 13),
  // Sprint 1A: TTL de reservas PENDING (minutos) y flags del job de expiración.
  RESERVATION_TTL_MINUTES: Number(process.env.RESERVATION_TTL_MINUTES ?? 30),
  DIRECT_DATABASE_URL: process.env.DIRECT_DATABASE_URL ?? "",
  ENABLE_JOBS: process.env.ENABLE_JOBS ?? "false",
};
