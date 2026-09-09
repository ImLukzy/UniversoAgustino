import type { NextFunction, Request, Response } from "express";
import { verifyAccess } from "../lib/auth.js";

export interface AuthedRequest extends Request {
  user?: { sub: string; role: string };
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Falta token" } });
  try {
    req.user = verifyAccess(token);
    next();
  } catch {
    return res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Token invalido o expirado" } });
  }
}

export const requireRole =
  (...roles: string[]) =>
  (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Falta auth" } });
    if (!roles.includes(req.user.role))
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Sin permisos" } });
    next();
  };
