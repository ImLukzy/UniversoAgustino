import rateLimit from "express-rate-limit";
import type { Options } from "express-rate-limit";

// Sprint F1: limitadores con contrato de error tipado. El handler por
// defecto de express-rate-limit responde texto plano; aquí devolvemos
// { error: { code: "RATE_LIMITED", ... } } + cabeceras RateLimit-*.
export function limit(opts: Partial<Options> & { windowMs: number; max: number }) {
  return rateLimit({
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: { code: "RATE_LIMITED", message: "Demasiados intentos. Espera un momento." },
      });
    },
    ...opts,
  });
}
