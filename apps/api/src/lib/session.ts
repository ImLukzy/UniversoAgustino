import type { Response } from "express";
import { prisma } from "./prisma.js";
import { newJti, sha256, signAccess, signRefresh } from "./auth.js";

// Sesión única para login, registro, rotación y OAuth: access JWT corto +
// refresh rotativo (hash sha256 en BD, revocable) en cookie httpOnly.
const REFRESH_MS = 7 * 86400_000;

export async function newSession(userId: string, role: string): Promise<{ access: string; refresh: string }> {
  const access = signAccess({ sub: userId, role });
  const refresh = signRefresh({ sub: userId, jti: newJti() });
  await prisma.refreshToken.create({ data: { userId, hash: sha256(refresh), expiresAt: new Date(Date.now() + REFRESH_MS) } });
  return { access, refresh };
}

export function setRefreshCookie(res: Response, refresh: string): void {
  res.cookie("hub_refresh", refresh, { httpOnly: true, sameSite: "lax", maxAge: REFRESH_MS });
}

// Crea la sesión, fija la cookie y devuelve el access para el cuerpo JSON.
export async function startSession(res: Response, userId: string, role: string): Promise<string> {
  const { access, refresh } = await newSession(userId, role);
  setRefreshCookie(res, refresh);
  return access;
}
