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

export function verifyAccess(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string; role: string };
}

export function verifyRefresh(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string; jti: string };
}

export const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
export const newJti = () => crypto.randomUUID();
