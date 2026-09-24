import type { Router } from "express";
import crypto from "node:crypto";
import { ForgotSchema, ResetSchema } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { hashPassword, sha256 } from "../../lib/auth.js";
import { mailer } from "../../lib/mailer.js";
import { env } from "../../env.js";
import { asyncHandler } from "../../middleware/errors.js";
import { limit } from "../../middleware/rateLimit.js";

// Sprint F1-01: recuperación con anti-enumeración (misma 202 exista o no).
// Doble limitador: por IP (5/15 min) y por email (3/hora) para no quemar el
// cupo de una víctima.
const forgotIpLimiter = limit({ windowMs: 15 * 60_000, max: 5, keyGenerator: (req) => req.ip ?? "unknown" });
const forgotEmailLimiter = limit({
  windowMs: 60 * 60_000,
  max: 3,
  keyGenerator: (req) => String(req.body?.email ?? "").toLowerCase() || (req.ip ?? "unknown"),
});

export function registerPassword(router: Router) {
  router.post(
    "/forgot",
    forgotIpLimiter,
    forgotEmailLimiter,
    asyncHandler(async (req, res) => {
      const { email } = ForgotSchema.parse(req.body);
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (user) {
        // Un solo token vivo por usuario (30 min).
        await prisma.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
        const raw = crypto.randomBytes(32).toString("base64url");
        await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: sha256(raw), expiresAt: new Date(Date.now() + 30 * 60_000), requestIp: req.ip } });
        const origin = env.WEB_ORIGIN[0] ?? "http://localhost:5173";
        await mailer.sendPasswordReset(user.email, `${origin}/reset-password?token=${raw}`).catch((e) => console.error("[mail] mail_send_failed", e));
      }
      return res.status(202).json({ ok: true });
    }),
  );

  router.post(
    "/reset",
    forgotIpLimiter,
    asyncHandler(async (req, res) => {
      const { token, password } = ResetSchema.parse(req.body);
      const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(token) } });
      if (!record || record.usedAt || record.expiresAt < new Date()) {
        return res.status(410).json({ error: { code: "TOKEN_EXPIRED", message: "El enlace ya no es válido. Solicita uno nuevo." } });
      }
      // El hash es costoso: fuera de la transacción. Se cierran todas las sesiones.
      const passwordHash = await hashPassword(password);
      await prisma.$transaction([
        prisma.user.update({ where: { id: record.userId }, data: { passwordHash, passwordChangedAt: new Date() } }),
        prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
        prisma.refreshToken.updateMany({ where: { userId: record.userId, revoked: false }, data: { revoked: true } }),
      ]);
      return res.json({ ok: true });
    }),
  );
}
