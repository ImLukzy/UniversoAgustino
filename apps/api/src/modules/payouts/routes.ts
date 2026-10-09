import { markRefundRequired } from "./refundRequired.js";
import { Router } from "express";
import { EarningsPeriodSchema, PayoutListSchema } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { type AuthedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errors.js";
import { accountRole } from "../staff/accountPermissions.js";
import { completePayout, resumePayout } from "./complete.js";
import { refundPayout } from "./refund.js";
export const payoutsRouter = Router();
payoutsRouter.get("/", asyncHandler(async (req: AuthedRequest, res) => {
  const role = await accountRole(prisma, req.user!.sub);
  const { status, page } = PayoutListSchema.parse(req.query);
  const rows = await prisma.payout.findMany({ where: { status, ...(role === "admin" ? {} : { collectorId: req.user!.sub }) },
    include: { order: { select: { itemTitle: true, itemType: true, handoverCase: { select: { status: true } }, buyer: { select: { email: true, profile: { select: { fullName: true } } } } } },
      seller: { select: { email: true, profile: { select: { fullName: true } } } } },
    orderBy: status === "COMPLETED" ? [{ completedAt: "desc" }, { id: "asc" }] : [{ dueAt: "asc" }, { id: "asc" }], skip: (page - 1) * 50, take: 51 });
  res.setHeader("Cache-Control", "private, no-store"); res.json({ data: rows.slice(0, 50), nextPage: rows.length > 50 ? page + 1 : null });
}));
payoutsRouter.get("/earnings", asyncHandler(async (req: AuthedRequest, res) => {
  const role = await accountRole(prisma, req.user!.sub);
  const period = EarningsPeriodSchema.parse(req.query);
  const rows = await prisma.payout.groupBy({ by: ["collectorId"], where: {
    status: { not: "REFUNDED" }, order: { status: { not: "REFUNDED" }, verifiedAt: { gte: new Date(period.from), lt: new Date(period.to) } },
    ...(role === "admin" ? {} : { collectorId: req.user!.sub }) }, _sum: { feeCents: true }, _count: { _all: true } });
  const people = await prisma.user.findMany({ where: { id: { in: rows.map((r) => r.collectorId) } }, select: { id: true, email: true, profile: { select: { fullName: true } } } });
  res.setHeader("Cache-Control", "private, no-store"); res.json({ data: { commissionCents: rows.reduce((n, r) => n + (r._sum.feeCents ?? 0), 0),
    verifiedCount: rows.reduce((n, r) => n + r._count._all, 0), collectors: rows.map((r) => ({ collectorId: r.collectorId, fullName: people.find((u) => u.id === r.collectorId)?.profile?.fullName, email: people.find((u) => u.id === r.collectorId)?.email, commissionCents: r._sum.feeCents ?? 0, verifiedCount: r._count._all })), ...period } });
}));
payoutsRouter.post("/:id/complete", asyncHandler(async (req: AuthedRequest, res) => res.json({ data: await completePayout(req.params.id, req.user!.sub, req.body) })));
payoutsRouter.post("/:id/resume", asyncHandler(async (req: AuthedRequest, res) => res.json({ data: await resumePayout(req.params.id, req.user!.sub, req.body) })));

payoutsRouter.post("/:id/refund-required", asyncHandler(async (req: AuthedRequest, res) => res.json({ data: await markRefundRequired(req.params.id, req.user!.sub, req.body) })));

payoutsRouter.post("/:id/refund", asyncHandler(async (req: AuthedRequest, res) => res.json({ data: await refundPayout(req.params.id, req.user!.sub, req.body) })));
