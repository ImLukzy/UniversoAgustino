import type { CookieOptions } from "express";

// Cookie del refresh. En producción la web y la API pueden vivir en sitios
// distintos (p. ej. Vercel + Render): el navegador solo envía la cookie
// cross-site con SameSite=None + Secure. La defensa CSRF la da
// requireSameOrigin (Origin exacto) en /auth/refresh y /auth/logout.
export function refreshCookieOptions(nodeEnv: string): CookieOptions {
  return nodeEnv === "production" ? { httpOnly: true, sameSite: "none", secure: true, path: "/" } : { httpOnly: true, sameSite: "lax", path: "/" };
}

// Detrás del proxy de Render, req.ip sería la IP del balanceador y todos los
// usuarios compartirían los límites por IP. Número de saltos de proxy
// confiables (TRUST_PROXY); por defecto 1 en producción y 0 en local.
export function trustProxyHops(nodeEnv: string, raw: string | undefined): number {
  const n = Number(raw);
  if (raw !== undefined && raw !== "" && Number.isInteger(n) && n >= 0) return n;
  return nodeEnv === "production" ? 1 : 0;
}

// Origen permitido: coincidencia exacta con WEB_ORIGIN (sin "/" final).
// startsWith dejaba pasar https://web.pe.evil.com.
export function isAllowedOrigin(allowed: string[], value: string): boolean {
  if (!value) return true;
  let origin: string;
  try {
    origin = new URL(value).origin;
  } catch {
    return false;
  }
  return allowed.some((o) => o.replace(/\/+$/, "") === origin);
}
