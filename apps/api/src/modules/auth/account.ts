import type { Router } from "express";
import { LoginSchema, RegisterSchema, isAllowedEmail } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { hashPassword, sha256, verifyPassword, verifyRefresh } from "../../lib/auth.js";
import { startSession } from "../../lib/session.js";
import { asyncHandler } from "../../middleware/errors.js";
import { limit } from "../../middleware/rateLimit.js";
import { requireSameOrigin } from "../../middleware/csrf.js";

const loginLimiter = limit({ windowMs: 15 * 60 * 1000, max: 50 });

// Cuenta con correo y clave: registro, login, rotación del refresh y logout.
export function registerAccount(router: Router) {
  router.post(
    "/register",
    loginLimiter,
    asyncHandler(async (req, res) => {
      const input = RegisterSchema.parse(req.body);
      const email = input.email.toLowerCase();
      // Defensa en profundidad: solo comunidad UNSA + excepción autorizada.
      if (!isAllowedEmail(email)) {
        return res.status(403).json({ error: { code: "EMAIL_NO_AUTORIZADO", message: "Acceso exclusivo comunidad UNSA: usa tu correo @unsa.edu.pe" } });
      }
      if (await prisma.user.findUnique({ where: { email } })) {
        return res.status(409).json({ error: { code: "EMAIL_TAKEN", message: "Email ya registrado" } });
      }
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: await hashPassword(input.password),
          role: "creator",
          profile: { create: { fullName: input.fullName, university: "UNSA", career: input.career, cycle: input.cycle } },
        },
        include: { profile: true },
      });
      await prisma.auditLog.create({ data: { actorId: user.id, action: "auth.register", entity: "user", entityId: user.id } });
      // Igual que /login: la sesión incluye el refresh en cookie (antes solo
      // se devolvía el access y la sesión se perdía al recargar).
      const access = await startSession(res, user.id, user.role);
      res.status(201).json({ data: { id: user.id, email: user.email, role: user.role, profile: user.profile, access } });
    }),
  );

  router.post(
    "/login",
    loginLimiter,
    asyncHandler(async (req, res) => {
      const input = LoginSchema.parse(req.body);
      const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
      // Cuentas 100% OAuth no tienen contraseña local: se deriva al proveedor.
      if (user && !user.passwordHash) return res.status(401).json({ error: { code: "OAUTH_ONLY", message: "Esta cuenta entra con Google, Apple o código al correo" } });
      if (!user || !(await verifyPassword(input.password, user.passwordHash!))) {
        return res.status(401).json({ error: { code: "BAD_CREDENTIALS", message: "Credenciales invalidas" } });
      }
      const access = await startSession(res, user.id, user.role);
      res.json({ data: { access, id: user.id, email: user.email, role: user.role } });
    }),
  );

  router.post(
    "/refresh",
    requireSameOrigin,
    asyncHandler(async (req, res) => {
      const raw = req.cookies?.["hub_refresh"] ?? req.body?.refresh;
      if (!raw) return res.status(401).json({ error: { code: "NO_REFRESH", message: "Falta refresh token" } });
      let payload: { sub: string; jti: string };
      try {
        payload = verifyRefresh(raw);
      } catch {
        return res.status(401).json({ error: { code: "BAD_REFRESH", message: "Refresh invalido" } });
      }
      const stored = await prisma.refreshToken.findUnique({ where: { hash: sha256(raw) } });
      if (!stored || stored.revoked || stored.expiresAt < new Date()) {
        return res.status(401).json({ error: { code: "BAD_REFRESH", message: "Refresh revocado" } });
      }
      // Rotación: el refresh usado se revoca y se emite uno nuevo.
      await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
      const user = await prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });
      const access = await startSession(res, user.id, user.role);
      res.json({ data: { access } });
    }),
  );

  router.post(
    "/logout",
    asyncHandler(async (req, res) => {
      const raw = req.cookies?.["hub_refresh"];
      if (raw) await prisma.refreshToken.updateMany({ where: { hash: sha256(raw) }, data: { revoked: true } });
      res.clearCookie("hub_refresh");
      res.json({ data: { ok: true } });
    }),
  );
}
