import type { Router } from "express";
import { EmailStartSchema, EmailVerifySchema } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { mailer } from "../../lib/mailer.js";
import { startSession } from "../../lib/session.js";
import { env } from "../../env.js";
import { LOGIN_CODE_RESEND_MS, LOGIN_CODE_TTL_MS, checkLoginCode, hashLoginCode, newLoginCode } from "../../lib/loginCode.js";
import { asyncHandler } from "../../middleware/errors.js";
import { limit } from "../../middleware/rateLimit.js";
import { requireSameOrigin } from "../../middleware/csrf.js";

// Spec 22: ingreso con correo institucional. /start valida el dominio exacto
// @unsa.edu.pe y envía un código al buzón; /verify lo canjea. Solo quien
// controla una cuenta real y activa del Workspace UNSA recibe el código, así
// que un correo inventado o externo nunca obtiene sesión. Primer canje =
// registro (perfil pendiente → /bienvenida); si ya existe, ingreso directo.
const emailKey = (req: { body?: { email?: unknown }; ip?: string }) => String(req.body?.email ?? "").trim().toLowerCase() || (req.ip ?? "unknown");
const startIpLimiter = limit({ windowMs: 15 * 60_000, max: 10, keyGenerator: (req) => req.ip ?? "unknown" });
const startEmailLimiter = limit({ windowMs: 60 * 60_000, max: 5, keyGenerator: emailKey });
const verifyLimiter = limit({ windowMs: 15 * 60_000, max: 30, keyGenerator: (req) => req.ip ?? "unknown" });

const DENIED = { code: "EMAIL_NO_AUTORIZADO", message: "Usa tu correo institucional @unsa.edu.pe" };
const err = (code: string, message: string, extra: Record<string, unknown> = {}) => ({ error: { code, message, ...extra } });

export function registerEmailLogin(router: Router) {
  router.post(
    "/email/start",
    requireSameOrigin,
    startIpLimiter,
    startEmailLimiter,
    asyncHandler(async (req, res) => {
      const parsed = EmailStartSchema.safeParse(req.body);
      if (!parsed.success) return res.status(403).json({ error: DENIED });
      if (!mailer.canDeliver()) return res.status(503).json(err("CORREO_NO_DISPONIBLE", "El ingreso con correo aún no está disponible"));
      const { email } = parsed.data;
      const last = await prisma.emailLoginCode.findFirst({ where: { email, usedAt: null }, orderBy: { createdAt: "desc" } });
      const wait = last ? LOGIN_CODE_RESEND_MS - (Date.now() - last.createdAt.getTime()) : 0;
      if (wait > 0) return res.status(429).json(err("ESPERA_REENVIO", "Espera un momento antes de pedir otro código", { retryIn: Math.ceil(wait / 1000) }));

      // Un solo código vivo por correo.
      await prisma.emailLoginCode.updateMany({ where: { email, usedAt: null }, data: { usedAt: new Date() } });
      const code = newLoginCode();
      const row = await prisma.emailLoginCode.create({
        data: { email, codeHash: hashLoginCode(env.JWT_ACCESS_SECRET, email, code), expiresAt: new Date(Date.now() + LOGIN_CODE_TTL_MS), requestIp: req.ip },
      });
      try {
        await mailer.sendLoginCode(email, code);
      } catch (e) {
        console.error("[mail] login_code_failed", e);
        await prisma.emailLoginCode.delete({ where: { id: row.id } });
        return res.status(502).json(err("CORREO_FALLIDO", "No pudimos enviar el código. Intenta de nuevo."));
      }
      res.status(202).json({ data: { email, expiresIn: LOGIN_CODE_TTL_MS / 1000, resendIn: LOGIN_CODE_RESEND_MS / 1000 } });
    }),
  );

  router.post(
    "/email/verify",
    requireSameOrigin,
    verifyLimiter,
    asyncHandler(async (req, res) => {
      const parsed = EmailVerifySchema.safeParse(req.body);
      if (!parsed.success) {
        const domain = parsed.error.issues.some((i) => i.path[0] === "email");
        return domain ? res.status(403).json({ error: DENIED }) : res.status(400).json(err("CODIGO_INCORRECTO", "El código tiene 6 dígitos"));
      }
      const { email, code } = parsed.data;
      const row = await prisma.emailLoginCode.findFirst({ where: { email, usedAt: null }, orderBy: { createdAt: "desc" } });
      const result = checkLoginCode(row, { secret: env.JWT_ACCESS_SECRET, email, code, now: new Date() });
      if (result === "VENCIDO") return res.status(410).json(err("CODIGO_VENCIDO", "El código venció. Pide uno nuevo."));
      if (result === "INTENTOS") {
        await prisma.emailLoginCode.update({ where: { id: row!.id }, data: { usedAt: new Date() } });
        return res.status(429).json(err("DEMASIADOS_INTENTOS", "Demasiados intentos. Pide un código nuevo."));
      }
      if (result === "INCORRECTO") {
        await prisma.emailLoginCode.update({ where: { id: row!.id }, data: { attempts: { increment: 1 } } });
        return res.status(400).json(err("CODIGO_INCORRECTO", "Código incorrecto"));
      }
      // Canje atómico: dos envíos simultáneos del mismo código no abren dos sesiones.
      const claimed = await prisma.emailLoginCode.updateMany({ where: { id: row!.id, usedAt: null }, data: { usedAt: new Date() } });
      if (claimed.count !== 1) return res.status(410).json(err("CODIGO_VENCIDO", "El código venció. Pide uno nuevo."));

      let user = await prisma.user.findUnique({ where: { email } });
      const isNew = !user;
      if (!user) {
        // Nombre vacío: lo completa el perfil obligatorio (onboardedAt nulo).
        user = await prisma.user.create({ data: { email, passwordHash: null, role: "creator", profile: { create: { fullName: "", university: "UNSA", career: "ENFERMERIA" } } } });
      }
      await prisma.auditLog.create({ data: { actorId: user.id, action: isNew ? "auth.email.register" : "auth.email.login", entity: "user", entityId: user.id } });
      const access = await startSession(res, user.id, user.role);
      res.status(isNew ? 201 : 200).json({ data: { access, isNew } });
    }),
  );
}
