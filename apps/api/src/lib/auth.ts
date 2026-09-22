import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { env } from "../env.js";

export const hashPassword = (plain: string) => bcrypt.hash(plain, 12);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

export function signAccess(payload: { sub: string; role: string }) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_TTL } as jwt.SignOptions);
}

export function signRefresh(payload: { sub: string; jti: string }) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_TTL } as jwt.SignOptions);
}

function verifyWithGrace(token: string, current: string, prev: string) {
  try {
    return jwt.verify(token, current);
  } catch (e) {
    // Ventana de gracia de rotación: solo se intenta el previo si existe y el
    // error es de firma (un token expirado no resucita con otro secreto).
    if (prev && e instanceof jwt.JsonWebTokenError && !(e instanceof jwt.TokenExpiredError)) {
      return jwt.verify(token, prev);
    }
    throw e;
  }
}

export function verifyAccess(token: string) {
  return verifyWithGrace(token, env.JWT_ACCESS_SECRET, env.JWT_ACCESS_SECRET_PREV) as { sub: string; role: string };
}

export function verifyRefresh(token: string) {
  return verifyWithGrace(token, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_SECRET_PREV) as { sub: string; jti: string };
}

export const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
export const newJti = () => crypto.randomUUID();
