import { Router } from "express";
import { asyncHandler } from "../../middleware/errors.js";
import { limit } from "../../middleware/rateLimit.js";
import { setRefreshCookie } from "../../lib/session.js";
import { appleCfg, googleCfg, takeCode } from "./oauth/session.js";
import { registerGoogle } from "./oauth/google.js";
import { registerApple } from "./oauth/apple.js";

// OAuth social (Google + Apple) con regla de dominio UNSA estricta.
// Flujo: inicio (redirect al proveedor) → callback (verifica state y
// dominio, crea/vincula usuario, emite sesión) → código de un solo uso →
// POST /consume lo canjea por access (mismo contrato que /login).
// Sin credenciales, cada proveedor responde 503 y el frontend no lo muestra.
export const oauthRouter = Router();
const oauthLimiter = limit({ windowMs: 15 * 60 * 1000, max: 50 });

oauthRouter.get(
  "/status",
  asyncHandler(async (_req, res) => {
    res.json({ data: { google: !!googleCfg(), apple: !!appleCfg() } });
  }),
);

registerGoogle(oauthRouter, oauthLimiter);
registerApple(oauthRouter, oauthLimiter);

// Canje del código de un solo uso por access (mismo contrato que /login).
oauthRouter.post(
  "/consume",
  oauthLimiter,
  asyncHandler(async (req, res) => {
    const entry = takeCode(typeof req.body?.code === "string" ? req.body.code : "");
    if (!entry) return res.status(400).json({ error: { code: "CODE_INVALIDO", message: "Código de ingreso inválido o vencido" } });
    setRefreshCookie(res, entry.refresh);
    res.json({ data: { access: entry.access } });
  }),
);
