import type { RequestHandler } from "express";

// Sprint 4 (F4-02): verificación de origen para rutas con cookie
// (POST /auth/refresh). SameSite=Lax ya acota el riesgo; esto cierra la
// puerta a refresh cross-site disparado desde otro origen.
// Se permite ausencia de Origin (curl, tests, clientes no navegador):
// un ataque CSRF real siempre llega desde un navegador, que envía Origin.
export const requireSameOrigin: RequestHandler = (req, res, next) => {
  const allowed = (process.env.WEB_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const origin = req.get("origin") ?? req.get("referer") ?? "";
  if (origin && !allowed.some((o) => origin.startsWith(o))) {
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "Origen no permitido" } });
  }
  next();
};
