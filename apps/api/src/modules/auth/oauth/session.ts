import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import type { Response } from "express";
import { prisma } from "../../../lib/prisma.js";
import { env } from "../../../env.js";
import { newSession, setRefreshCookie } from "../../../lib/session.js";

// Piezas comunes del OAuth social (Google/Apple): configuración, state
// firmado, código de un solo uso y creación/vinculación del usuario.
const webOrigin = () => env.WEB_ORIGIN[0] ?? "http://localhost:5173";

export function googleCfg(): { id: string; secret: string; redirect: string } | null {
  const { GOOGLE_CLIENT_ID: id, GOOGLE_CLIENT_SECRET: secret, GOOGLE_REDIRECT_URI: redirect } = env;
  return id && secret && redirect ? { id, secret, redirect } : null;
}

export function appleCfg(): { id: string; redirect: string } | null {
  const { APPLE_CLIENT_ID: id, APPLE_REDIRECT_URI: redirect } = env;
  return id && redirect ? { id, redirect } : null;
}

// state firmado (10 min): el callback solo sigue si lo emitimos nosotros.
export function signState(): string {
  return jwt.sign({ n: crypto.randomUUID() }, env.JWT_ACCESS_SECRET, { expiresIn: "10m" } as jwt.SignOptions);
}

export function validState(state: unknown): boolean {
  try {
    jwt.verify(String(state ?? ""), env.JWT_ACCESS_SECRET);
    return true;
  } catch {
    return false;
  }
}

export function fail(res: Response, code: string): void {
  res.redirect(`${webOrigin()}/auth/callback?error=${code}`);
}

// Códigos de un solo uso (115 s): el callback los emite y POST /consume los
// canjea. En memoria con barrido perezoso (multi-instancia: store compartido,
// ver docs/oauth.md).
const codes = new Map<string, { access: string; refresh: string; exp: number }>();
function sweepCodes(): void {
  const now = Date.now();
  for (const [k, v] of codes) if (v.exp < now) codes.delete(k);
}

export function takeCode(code: string) {
  sweepCodes();
  const entry = code ? codes.get(code) : undefined;
  if (entry) codes.delete(code);
  return entry;
}

export async function issueSession(res: Response, userId: string, role: string): Promise<void> {
  const { access, refresh } = await newSession(userId, role);
  sweepCodes();
  const code = crypto.randomBytes(24).toString("base64url");
  codes.set(code, { access, refresh, exp: Date.now() + 115_000 });
  setRefreshCookie(res, refresh);
  res.redirect(`${webOrigin()}/auth/callback?code=${code}`);
}

export const auditAuth = (actorId: string, action: string, entityId: string) =>
  prisma.auditLog.create({ data: { actorId, action, entity: "user", entityId } }).catch(() => undefined);

export async function findOrCreateOAuthUser(input: { provider: "google" | "apple"; providerId: string; email: string; fullName: string; avatarUrl: string | null }) {
  const email = input.email.toLowerCase();
  let user = await prisma.user.findFirst({ where: { OR: [{ provider: input.provider, providerId: input.providerId }, { email }] } });
  if (user && user.provider && user.provider !== input.provider) return { conflict: true as const, user: null };
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: null,
        role: "creator",
        provider: input.provider,
        providerId: input.providerId,
        avatarUrl: input.avatarUrl,
        profile: { create: { fullName: input.fullName, university: "UNSA", career: "ENFERMERIA" } },
      },
    });
    await auditAuth(user.id, "auth.oauth.register", user.id);
  } else if (!user.provider) {
    // Vincula la cuenta con clave existente: el email viene verificado por el
    // proveedor, así que es seguro enlazar por igualdad exacta.
    user = await prisma.user.update({ where: { id: user.id }, data: { provider: input.provider, providerId: input.providerId, avatarUrl: user.avatarUrl ?? input.avatarUrl } });
    await auditAuth(user.id, "auth.oauth.link", user.id);
  } else if (input.avatarUrl && user.avatarUrl !== input.avatarUrl) {
    // Foto del proveedor al día en cada ingreso.
    user = await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: input.avatarUrl } });
  }
  // Toda cuenta de la comunidad UNSA queda con perfil (nombre del proveedor,
  // universidad UNSA; carrera por defecto, editable en Ajustes).
  await prisma.profile.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id, fullName: input.fullName, university: "UNSA", career: "ENFERMERIA" } });
  return { conflict: false as const, user };
}
