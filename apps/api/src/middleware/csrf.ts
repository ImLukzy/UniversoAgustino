import type { RequestHandler } from "express";
import { isAllowedOrigin } from "../lib/cookies.js";

// Sprint 4 (F4-02): verificación de origen para rutas con cookie
// (POST /auth/refresh, /auth/logout). En producción la cookie es
// SameSite=None (web y API en sitios distintos), así que esta es la defensa
// CSRF: Origin (o Referer) debe coincidir exactamente con WEB_ORIGIN.
// Se permite ausencia de Origin (curl, tests, clientes no navegador):
// un ataque CSRF real siempre llega desde un navegador, que envía Origin.
export const requireSameOrigin: RequestHandler = (req, res, next) => {
  const allowed = (process.env.WEB_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const origin = req.get("origin") ?? req.get("referer") ?? "";
  if (!isAllowedOrigin(allowed, origin)) {
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "Origen no permitido" } });
  }
  next();
};
