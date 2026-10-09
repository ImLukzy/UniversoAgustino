import { Router } from "express";
import { RejectOrderSchema } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/errors.js";
import type { AuthedRequest } from "../../middleware/auth.js";
import { accountRole } from "./accountPermissions.js";
import { reviewDigitalPayment } from "./verifyPayment.js";
export const staffPaymentsRouter = Router();
staffPaymentsRouter.get("/", asyncHandler(async (req: AuthedRequest, res) => {
  const role = await accountRole(prisma, req.user!.sub);
  const rows = await prisma.order.findMany({ where: { itemType: "document", status: "PAID", verifiedAt: null,
    paymentRejectedReason: null, paymentAccountId: { not: null },
    ...(role === "admin" ? {} : { paymentAccount: { userId: req.user!.sub } }) },
    include: { buyer: { select: { id: true, email: true, profile: { select: { fullName: true } } } } },
    orderBy: { proofSubmittedAt: "asc" }, take: 50 });
  const docs = await prisma.document.findMany({ where: { id: { in: rows.map((o) => o.itemId) } },
    select: { id: true, title: true, course: true, description: true, type: true } });
  res.setHeader("Cache-Control", "private, no-store");
  res.json({ data: rows.map((order) => ({ ...order, document: docs.find((d) => d.id === order.itemId) ?? null })) });
}));
staffPaymentsRouter.post("/:id/accept", asyncHandler(async (req: AuthedRequest, res) => {
  res.json({ data: await reviewDigitalPayment(req.params.id, req.user!.sub, true) });
}));
staffPaymentsRouter.post("/:id/deny", asyncHandler(async (req: AuthedRequest, res) => {
  const { reason } = RejectOrderSchema.parse(req.body);
  res.json({ data: await reviewDigitalPayment(req.params.id, req.user!.sub, false, reason) });
}));
