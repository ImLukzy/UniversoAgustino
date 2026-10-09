import { registerSellerPayment } from "./sellerPayment.js";
import { Router } from "express";
import { z } from "zod";
import { CaseStatusSchema } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/errors.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { caseInclude, currentActor } from "./caseGuard.js";
import { scheduleFail } from "../staff/scheduleGuard.js";
import { chatRouter } from "./chatRoutes.js";

export const participantCasesRouter = Router();
participantCasesRouter.use(requireAuth);
registerSellerPayment(participantCasesRouter);
participantCasesRouter.use("/:id/messages", chatRouter);
participantCasesRouter.get("/order/:orderId", asyncHandler(async (req: AuthedRequest, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
  if (!order || ![order.buyerId, order.sellerId].includes(req.user!.sub)) scheduleFail("NOT_FOUND", "Caso no encontrado", 404);
  const row = await prisma.handoverCase.findUnique({ where: { orderId: order.id }, include: caseInclude });
  res.setHeader("Cache-Control", "private, no-store");
  res.json({ data: row ? { id: row.id, status: row.status, receivedPhotoUrl: row.receivedPhotoUrl, conditionNote: row.conditionNote,
    isSeller: order.sellerId === req.user!.sub, paymentRecorded: !!order.verifiedAt,
    paymentRef: order.buyerId === req.user!.sub ? row.paymentRef : null, paymentMethod: row.paymentMethod,
    returnCondition: row.returnCondition, returnConditionNote: row.returnConditionNote, returnPhotoUrl: row.returnPhotoUrl,
    staffName: row.assignee?.profile?.fullName ?? "Equipo", amountCents: order.amountCents, sede: row.sede,
    appointments: row.appointments.filter((a) => a.partyId === req.user!.sub).map((a) => ({ id: a.id, kind: a.kind,
      startsAt: a.startsAt, endsAt: a.endsAt, status: a.status, sede: a.sede })) } : null });
}));
const filter = z.object({ page: z.coerce.number().int().min(1).default(1), status: CaseStatusSchema.optional(), assigneeId: z.string().optional() });
export function registerQueries(casesRouter: Router) {
  casesRouter.get("/", asyncHandler(async (req: AuthedRequest, res) => {
    const actor = await currentActor(prisma, req.user!), input = filter.parse(req.query);
    const where = { ...(input.status ? { status: input.status } : {}),
      ...(actor.role === "admin" ? (input.assigneeId ? { assigneeId: input.assigneeId } : {}) : { OR: [{ assigneeId: null }, { assigneeId: actor.sub }] }) };
    const [data, total] = await Promise.all([prisma.handoverCase.findMany({ where, include: { ...caseInclude, order: { include: { payout: { select: { refundRequired: true, status: true } } } } }, orderBy: { createdAt: "desc" }, skip: (input.page - 1) * 20, take: 20 }), prisma.handoverCase.count({ where })]);
    res.json({ data, meta: { page: input.page, total, pageSize: 20 } });
  }));
  casesRouter.get("/:id", asyncHandler(async (req: AuthedRequest, res) => {
    const actor = await currentActor(prisma, req.user!);
    const row = await prisma.handoverCase.findUnique({ where: { id: req.params.id }, include: caseInclude });
    if (!row || (actor.role !== "admin" && row.assigneeId && row.assigneeId !== actor.sub)) scheduleFail("NOT_FOUND", "Caso no encontrado", 404);
    res.json({ data: row });
  }));
}
