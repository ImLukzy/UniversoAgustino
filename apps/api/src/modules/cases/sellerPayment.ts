import type { Router } from "express";
import { SellerPaymentReportSchema } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/errors.js";
import type { AuthedRequest } from "../../middleware/auth.js";
import { scheduleFail } from "../staff/scheduleGuard.js";
import { createPaymentReport } from "../payouts/claims.js";
async function sellerCase(orderId: string, sellerId: string) {
  const row = await prisma.handoverCase.findUnique({ where: { orderId }, include: { order: true } });
  if (!row || row.order.sellerId !== sellerId) scheduleFail("NOT_FOUND", "Caso no encontrado", 404);
  return row;
}
export async function confirmSellerPayment(orderId: string, sellerId: string) {
  await sellerCase(orderId, sellerId);
  scheduleFail("TEAM_SETTLEMENT", "El equipo liquida con comprobante; consulta Mis cobros");
}
export async function reportSellerPayment(orderId: string, sellerId: string, reason: string) {
  await sellerCase(orderId, sellerId);
  return createPaymentReport({ targetType: "order", targetId: orderId, reason }, sellerId);
}
export function registerSellerPayment(participantCasesRouter: Router) {
  participantCasesRouter.post("/order/:orderId/confirm-payment", asyncHandler(async (req: AuthedRequest, res) => {
    res.json({ data: await confirmSellerPayment(req.params.orderId, req.user!.sub) });
  }));
  participantCasesRouter.post("/order/:orderId/payment-report", asyncHandler(async (req: AuthedRequest, res) => {
    const input = SellerPaymentReportSchema.parse(req.body);
    res.status(201).json({ data: await reportSellerPayment(req.params.orderId, req.user!.sub, input.reason) });
  }));
}
