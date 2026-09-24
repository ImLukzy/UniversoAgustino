import { Router } from "express";
import { CAREER_FACULTY, OnboardingSchema, UpdateProfileSchema } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/errors.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { registerAccount } from "./account.js";
import { registerPassword } from "./password.js";
import { registerEmailLogin } from "./emailLogin.js";

// Auth: cuenta (registro/login/refresh/logout), recuperación de clave,
// ingreso con código al correo UNSA (spec 22) y perfil.
export const authRouter = Router();
registerAccount(authRouter);
registerPassword(authRouter);
registerEmailLogin(authRouter);

const facultyOf = (career: string) => (CAREER_FACULTY as Record<string, string>)[career] ?? null;

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const me = await prisma.user.findUnique({ where: { id: req.user!.sub }, include: { profile: true } });
    if (!me) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Usuario no existe" } });
    const { passwordHash, ...safe } = me;
    res.json({ data: safe });
  }),
);

// Perfil obligatorio de primer ingreso (spec 21): nombre completo, facultad,
// carrera oficial, ciclo y celular. El correo sale de la sesión (verificado
// por el proveedor) y nunca del cuerpo. Solo una vez: después se edita en Ajustes.
authRouter.post(
  "/onboarding",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const input = OnboardingSchema.parse(req.body);
    const userId = req.user!.sub;
    const current = await prisma.profile.findUnique({ where: { userId } });
    if (current?.onboardedAt) return res.status(409).json({ error: { code: "PERFIL_COMPLETO", message: "Tu perfil ya está completo" } });
    const data = { fullName: input.fullName, faculty: input.faculty, career: input.career, cycle: input.cycle, phone: input.phone, onboardedAt: new Date() };
    const profile = await prisma.profile.upsert({ where: { userId }, create: { userId, university: "UNSA", ...data }, update: data });
    await prisma.auditLog.create({ data: { actorId: userId, action: "auth.onboarding", entity: "profile", entityId: profile.id } });
    res.status(201).json({ data: profile });
  }),
);

authRouter.patch(
  "/profile",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const input = UpdateProfileSchema.parse(req.body);
    // La facultad acompaña a la carrera: nunca quedan desalineadas.
    const faculty = facultyOf(input.career);
    const profile = await prisma.profile.upsert({
      where: { userId: req.user!.sub },
      create: { userId: req.user!.sub, fullName: input.fullName, university: "UNSA", career: input.career, faculty, cycle: input.cycle },
      update: { fullName: input.fullName, career: input.career, faculty, cycle: input.cycle },
    });
    await prisma.auditLog.create({ data: { actorId: req.user!.sub, action: "auth.profile.update", entity: "profile", entityId: profile.id } });
    res.json({ data: profile });
  }),
);
