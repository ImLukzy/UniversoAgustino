import { Router } from "express";
import { z } from "zod";
import { LiftSchema, ReviewInputSchema, SanctionInputSchema, canApplySanction } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { notify } from "../../lib/notify.js";
import { asyncHandler } from "../../middleware/errors.js";
import type { AuthedRequest } from "../../middleware/auth.js";
import { scheduleFail } from "../staff/scheduleGuard.js";
import { sanctionEnd } from "./strikes.js";

export const usersRouter = Router();
const DAY_MS = 86_400_000;
const brief = { id: true, email: true, role: true, createdAt: true, profile: { select: { fullName: true, career: true } } } as const;
async function roleOf(id: string) {
  const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!u || !["admin", "moderator"].includes(u.role)) scheduleFail("FORBIDDEN", "Solo el equipo", 403);
  return u.role;
}
async function target(id: string) {
  const u = await prisma.user.findUnique({ where: { id }, select: { ...brief } });
  if (!u) scheduleFail("NOT_FOUND", "Usuario no encontrado", 404);
  if (u.role === "admin" || u.role === "moderator") scheduleFail("TARGET_IS_STAFF", "No se califica ni sanciona a miembros del equipo");
  return u;
}
usersRouter.get("/", asyncHandler(async (req, res) => {
  const q = z.string().trim().min(2).max(80).parse(req.query.q);
  const rows = await prisma.user.findMany({ where: { OR: [{ email: { contains: q, mode: "insensitive" } }, { profile: { fullName: { contains: q, mode: "insensitive" } } }] }, select: brief, take: 20, orderBy: { email: "asc" } });
  res.json({ data: rows.map((u) => ({ id: u.id, email: u.email, role: u.role, fullName: u.profile?.fullName ?? "" })) });
}));
usersRouter.get("/:id", asyncHandler(async (req, res) => {
  const user = await target(String(req.params.id)), id = user.id;
  const [strikes, reviews, sanctions, orders] = await Promise.all([
    prisma.strike.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 50, include: { appointment: { select: { kind: true, startsAt: true } } } }),
    prisma.userReview.findMany({ where: { subjectId: id }, orderBy: { createdAt: "desc" }, take: 50, include: { author: { select: { profile: { select: { fullName: true } } } } } }),
    prisma.sanction.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.order.findMany({ where: { OR: [{ buyerId: id }, { sellerId: id }] }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, itemTitle: true, status: true, buyerId: true, createdAt: true } }),
  ]);
  const scored = reviews.filter((r) => r.score > 0);
  res.json({ data: { user: { id, email: user.email, fullName: user.profile?.fullName ?? "", career: user.profile?.career ?? "", createdAt: user.createdAt },
    average: scored.length ? Math.round((scored.reduce((a, r) => a + r.score, 0) / scored.length) * 10) / 10 : null,
    strikes: strikes.map((s) => ({ id: s.id, createdAt: s.createdAt, forgivenAt: s.forgivenAt, kind: s.appointment.kind, startsAt: s.appointment.startsAt })),
    reviews: reviews.map((r) => ({ id: r.id, score: r.score, comment: r.comment, caseId: r.caseId, createdAt: r.createdAt, authorName: r.author.profile?.fullName ?? "Equipo" })),
    sanctions, deals: orders.map((o) => ({ id: o.id, itemTitle: o.itemTitle, status: o.status, as: o.buyerId === id ? "comprador" : "vendedor", createdAt: o.createdAt })) } });
}));
usersRouter.post("/:id/reviews", asyncHandler(async (req: AuthedRequest, res) => {
  await roleOf(req.user!.sub);
  const input = ReviewInputSchema.parse(req.body), subject = await target(String(req.params.id));
  if (input.caseId && await prisma.userReview.findFirst({ where: { authorId: req.user!.sub, subjectId: subject.id, caseId: input.caseId }, select: { id: true } }))
    scheduleFail("ALREADY_REVIEWED", "Ya calificaste a esta persona en ese caso");
  const row = await prisma.userReview.create({ data: { subjectId: subject.id, authorId: req.user!.sub, caseId: input.caseId, score: input.score, comment: input.comment } });
  await prisma.auditLog.create({ data: { actorId: req.user!.sub, action: "review.create", entity: "user", entityId: subject.id } });
  res.status(201).json({ data: { id: row.id } });
}));
usersRouter.post("/:id/sanctions", asyncHandler(async (req: AuthedRequest, res) => {
  const role = await roleOf(req.user!.sub), input = SanctionInputSchema.parse(req.body), subject = await target(String(req.params.id));
  if (!canApplySanction(role, input.kind)) scheduleFail("FORBIDDEN", "Solo el Técnico aplica suspensiones y bloqueos", 403);
  const now = new Date(), endsAt = input.days ? new Date(now.getTime() + input.days * DAY_MS) : null;
  const row = await prisma.$transaction(async (tx) => {
    if (input.kind !== "WARNING") {
      const live = await tx.sanction.count({ where: { userId: subject.id, liftedAt: null, kind: input.kind === "BAN" ? "BAN" : { in: ["SUSPENSION", "BAN"] }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] } });
      if (live) scheduleFail("ALREADY_SANCTIONED", "La persona ya tiene una sanción vigente de ese nivel");
    }
    const created = await tx.sanction.create({ data: { userId: subject.id, kind: input.kind, reason: input.reason, startsAt: now, endsAt, byId: req.user!.sub } });
    await tx.auditLog.create({ data: { actorId: req.user!.sub, action: `sanction.${input.kind.toLowerCase()}`, entity: "Sanction", entityId: created.id } });
    return created;
  });
  await notify({ userId: subject.id, type: "SANCTION_APPLIED", link: "/panel",
    title: input.kind === "WARNING" ? "Recibiste una advertencia" : input.kind === "BAN" ? "Tu cuenta fue bloqueada" : "Tu cuenta fue suspendida",
    body: input.kind === "WARNING" ? `Motivo: ${input.reason}.` : `Motivo: ${input.reason}. No podrás solicitar ni publicar${endsAt ? ` hasta el ${sanctionEnd(row)}` : ""}.` });
  res.status(201).json({ data: row });
}));
usersRouter.post("/:id/sanctions/:sid/lift", asyncHandler(async (req: AuthedRequest, res) => {
  if (await roleOf(req.user!.sub) !== "admin") scheduleFail("FORBIDDEN", "Solo el Técnico levanta sanciones", 403);
  const { reason } = LiftSchema.parse(req.body), userId = String(req.params.id), now = new Date();
  const changed = await prisma.$transaction(async (tx) => {
    const done = await tx.sanction.updateMany({ where: { id: String(req.params.sid), userId, liftedAt: null, OR: [{ endsAt: null }, { endsAt: { gt: now } }] }, data: { liftedAt: now, liftedById: req.user!.sub } });
    if (done.count) await tx.auditLog.create({ data: { actorId: req.user!.sub, action: "sanction.lift", entity: "Sanction", entityId: String(req.params.sid) } });
    return done.count;
  });
  if (!changed) scheduleFail("NOT_FOUND", "Sanción vigente no encontrada", 404);
  await notify({ userId, type: "SANCTION_LIFTED", title: "Se levantó tu sanción", body: `El equipo levantó la sanción de tu cuenta. ${reason}`, link: "/panel" });
  res.json({ data: { id: String(req.params.sid), liftedAt: now } });
}));
usersRouter.post("/:id/strikes/:strikeId/forgive", asyncHandler(async (req: AuthedRequest, res) => {
  if (await roleOf(req.user!.sub) !== "admin") scheduleFail("FORBIDDEN", "Solo el Técnico perdona faltas", 403);
  const reason = LiftSchema.parse(req.body).reason;
  const done = await prisma.$transaction(async (tx) => {
    const r = await tx.strike.updateMany({ where: { id: String(req.params.strikeId), userId: String(req.params.id), forgivenAt: null }, data: { forgivenAt: new Date(), forgivenById: req.user!.sub } });
    if (r.count) await tx.auditLog.create({ data: { actorId: req.user!.sub, action: "strike.forgive", entity: "Strike", entityId: String(req.params.strikeId) } });
    return r.count;
  });
  if (!done) scheduleFail("NOT_FOUND", "Falta vigente no encontrada", 404);
  res.json({ data: { id: String(req.params.strikeId), reason } });
}));
