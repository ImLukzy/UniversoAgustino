import { staffPaymentsRouter } from "./payments.js";
import { Router } from "express";
import { StaffMemberSchema } from "@hub/shared";
import { notify } from "../../lib/notify.js";
import { reviewsRouter } from "./reviews.js";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/errors.js";
import { requireAuth, requireRole, type AuthedRequest } from "../../middleware/auth.js";

import { staffSedesRouter } from "./sedes.js";
import { scheduleRouter } from "./schedule.js";
import { casesRouter } from "../cases/routes.js";
import { shiftsRouter } from "./shifts.js";
import { usersRouter } from "../sanctions/users.js";
import { agendaRouter, metricsRouter } from "../agenda/routes.js";

import { paymentAccountsRouter } from "./paymentAccounts.js";

export const staffRouter = Router();
staffRouter.use(requireAuth, requireRole("moderator", "admin"));
staffRouter.use("/payment-accounts", paymentAccountsRouter);
staffRouter.use("/payments", staffPaymentsRouter);
staffRouter.use("/reviews", reviewsRouter);
staffRouter.use("/sedes", staffSedesRouter);
staffRouter.use("/schedule", scheduleRouter);
staffRouter.use("/shifts", shiftsRouter);
staffRouter.use("/cases", casesRouter);
staffRouter.use("/users", usersRouter);
staffRouter.use("/agenda", agendaRouter);
staffRouter.use("/metrics", metricsRouter);
const memberSelect = { id: true, email: true, role: true, createdAt: true, profile: { select: { fullName: true } } } as const;
function fail(status: number, code: string, message: string): never {
  throw Object.assign(new Error(message), { status, code });
}

staffRouter.get("/members", asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({
    where: { role: { in: ["moderator", "admin"] } }, select: memberSelect, orderBy: { createdAt: "asc" },
  });
  const additions = await prisma.auditLog.findMany({
    where: { entity: "user", entityId: { in: users.map((u) => u.id) }, action: { in: ["staff.add", "staff.grant"] } },
    orderBy: { createdAt: "desc" }, select: { entityId: true, createdAt: true },
  });
  res.json({ data: users.map((u) => ({
    id: u.id, email: u.email, role: u.role, fullName: u.profile?.fullName ?? "",
    since: additions.find((a) => a.entityId === u.id)?.createdAt ?? u.createdAt,
  })) });
}));

staffRouter.post("/members", requireRole("admin"), asyncHandler(async (req: AuthedRequest, res) => {
  const { email } = StaffMemberSchema.parse(req.body);
  const member = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { email }, select: memberSelect });
    if (!user) fail(404, "USER_NOT_FOUND", "Esa persona aún no ingresó a Universo Agustino");
    const changed = await tx.user.updateMany({ where: { id: user.id, role: { in: ["student", "creator"] } }, data: { role: "moderator" } });
    if (!changed.count) fail(409, "ALREADY_STAFF", "Esa persona ya forma parte del equipo");
    const audit = await tx.auditLog.create({ data: { actorId: req.user!.sub, action: "staff.add", entity: "user", entityId: user.id } });
    return { id: user.id, email: user.email, fullName: user.profile?.fullName ?? "", role: "moderator", since: audit.createdAt };
  });
  await notify({ userId: member.id, type: "STAFF_ADDED", title: "Ya eres parte del equipo", body: "Tienes acceso al panel del equipo de Universo Agustino.", link: "/equipo" });
  res.json({ data: member });
}));

staffRouter.delete("/members/:userId", requireRole("admin"), asyncHandler(async (req: AuthedRequest, res) => {
  const userId = req.params.userId;
  if (userId === req.user!.sub) fail(409, "SELF_REMOVE", "No puedes quitarte del equipo");
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(300030)::text`;
    if (await tx.handoverCase.count({ where: { assigneeId: userId, status: { notIn: ["CLOSED", "CANCELLED"] } } })) fail(409, "HAS_CASES", "Reasigna o cierra sus casos primero");
    if (await tx.appointment.count({ where: { staffId: userId, status: "SCHEDULED", endsAt: { gt: new Date() } } })) fail(409, "HAS_APPOINTMENTS", "Cancela o reasigna sus citas primero");
    const user = await tx.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user) fail(404, "USER_NOT_FOUND", "Usuario no encontrado");
    if (user.role === "admin") fail(409, "IS_ADMIN", "No puedes quitar a otro administrador");
    const changed = await tx.user.updateMany({ where: { id: userId, role: "moderator" }, data: { role: "creator" } });
    if (!changed.count) fail(409, "NOT_STAFF", "Esa persona no es moderadora");
    await tx.paymentAccount.updateMany({ where: { userId }, data: { active: false } });
    await tx.refreshToken.updateMany({ where: { userId, revoked: false }, data: { revoked: true } });
    await tx.auditLog.create({ data: { actorId: req.user!.sub, action: "staff.remove", entity: "user", entityId: userId } });
  });
  await notify({ userId, type: "STAFF_REMOVED", title: "Tu acceso al equipo terminó", body: "Tu cuenta conserva el acceso al marketplace.", link: "/panel" });
  res.json({ data: { id: userId, role: "creator" } });
}));
