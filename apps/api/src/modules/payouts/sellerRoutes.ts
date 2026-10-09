import { Router } from "express";
import { PayoutListSchema } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errors.js";
export const sellerPayoutsRouter = Router();
sellerPayoutsRouter.get("/", requireAuth, asyncHandler(async (req: AuthedRequest, res) => {
  const { page } = PayoutListSchema.parse(req.query);
  const rows = await prisma.payout.findMany({ where: { sellerId: req.user!.sub }, select: {
    id: true, orderId: true, amountCents: true, feeCents: true, netCents: true, status: true, dueAt: true, createdAt: true,
    completedAt: true, proofUrl: true, paymentRef: true, frozenReason: true, refundRequired: true, order: { select: { itemTitle: true, feeBps: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }], skip: (page - 1) * 50, take: 51 });
  res.setHeader("Cache-Control", "private, no-store"); res.json({ data: rows.slice(0, 50), nextPage: rows.length > 50 ? page + 1 : null });
}));
