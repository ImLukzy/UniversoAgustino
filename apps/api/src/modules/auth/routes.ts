import { Router } from "express";
import rateLimit from "express-rate-limit";
import { LoginSchema, RegisterSchema, UpdateProfileSchema, isAllowedEmail } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { hashPassword, newJti, sha256, signAccess, signRefresh, verifyPassword, verifyRefresh } from "../../lib/auth.js";
import { asyncHandler } from "../../middleware/errors.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";

export const authRouter = Router();

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const input = RegisterSchema.parse(req.body);
    const email = input.email.toLowerCase();
    // Defensa en profundidad: solo comunidad UNSA + excepción autorizada.
    if (!isAllowedEmail(email))
      return res.status(403).json({ error: { code: "EMAIL_NO_AUTORIZADO", message: "Acceso exclusivo comunidad UNSA: usa tu correo @unsa.edu.pe" } });
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: { code: "EMAIL_TAKEN", message: "Email ya registrado" } });
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(input.password),
        role: "creator",
        profile: {
          create: { fullName: input.fullName, university: "UNSA", career: input.career, cycle: input.cycle },
        },
      },
      include: { profile: true },
    });
    await prisma.auditLog.create({ data: { actorId: user.id, action: "auth.register", entity: "user", entityId: user.id } });
    const access = signAccess({ sub: user.id, role: user.role });
    res.status(201).json({ data: { id: user.id, email: user.email, role: user.role, profile: user.profile, access } });
  })
);

authRouter.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const input = LoginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (!user || !(await verifyPassword(input.password, user.passwordHash)))
      return res.status(401).json({ error: { code: "BAD_CREDENTIALS", message: "Credenciales invalidas" } });
    const access = signAccess({ sub: user.id, role: user.role });
    const jti = newJti();
    const refresh = signRefresh({ sub: user.id, jti });
    await prisma.refreshToken.create({
      data: { userId: user.id, hash: sha256(refresh), expiresAt: new Date(Date.now() + 7 * 86400_000) },
    });
    res.cookie("hub_refresh", refresh, { httpOnly: true, sameSite: "lax", maxAge: 7 * 86400_000 });
    res.json({ data: { access, id: user.id, email: user.email, role: user.role } });
  })
);

authRouter.post(
  "/refresh",
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
    if (!stored || stored.revoked || stored.expiresAt < new Date())
      return res.status(401).json({ error: { code: "BAD_REFRESH", message: "Refresh revocado" } });
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });
    const access = signAccess({ sub: user.id, role: user.role });
    const jti = newJti();
    const refresh = signRefresh({ sub: user.id, jti });
    await prisma.refreshToken.create({
      data: { userId: user.id, hash: sha256(refresh), expiresAt: new Date(Date.now() + 7 * 86400_000) },
    });
    res.cookie("hub_refresh", refresh, { httpOnly: true, sameSite: "lax", maxAge: 7 * 86400_000 });
    res.json({ data: { access } });
  })
);

authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const raw = req.cookies?.["hub_refresh"];
    if (raw) await prisma.refreshToken.updateMany({ where: { hash: sha256(raw) }, data: { revoked: true } });
    res.clearCookie("hub_refresh");
    res.json({ data: { ok: true } });
  })
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const me = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      include: { profile: true },
    });
    if (!me) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Usuario no existe" } });
    const { passwordHash: _omit, ...safe } = me;
    res.json({ data: safe });
  })
);

authRouter.patch(
  "/profile",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const input = UpdateProfileSchema.parse(req.body);
    const profile = await prisma.profile.upsert({
      where: { userId: req.user!.sub },
      create: { userId: req.user!.sub, fullName: input.fullName, university: "UNSA", career: input.career, cycle: input.cycle },
      update: { fullName: input.fullName, career: input.career, cycle: input.cycle },
    });
    await prisma.auditLog.create({ data: { actorId: req.user!.sub, action: "auth.profile.update", entity: "profile", entityId: profile.id } });
    res.json({ data: profile });
  })
);
