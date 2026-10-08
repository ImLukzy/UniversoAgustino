import type { Router } from "express";
import type { Prisma } from "@prisma/client";
import { SellerPaymentReportSchema } from "@hub/shared";
import { asyncHandler } from "../../middleware/errors.js";
import type { AuthedRequest } from "../../middleware/auth.js";
import { scheduleChange, scheduleFail } from "../staff/scheduleGuard.js";

async function sellerCase(tx: Prisma.TransactionClient, orderId: string, sellerId: string) {
  const row = await tx.handoverCase.findUnique({ where: { orderId }, include: { order: true } });
  if (!row || row.order.sellerId !== sellerId) scheduleFail("NOT_FOUND", "Caso no encontrado", 404);
  if (!row.paymentRef || !row.paymentMethod) scheduleFail("BAD_STATE", "El equipo todavía no registró el pago físico");
  return row;
}
export async function confirmSellerPayment(orderId: string, sellerId: string) {
  return scheduleChange(sellerId, "case.seller_payment_confirmed", "order", orderId, async (tx) => {
    const row = await sellerCase(tx, orderId, sellerId);
    if (row.sellerConfirmedAt) scheduleFail("ALREADY_CONFIRMED", "El cobro ya fue confirmado");
    return tx.handoverCase.update({ where: { id: row.id }, data: { sellerConfirmedAt: new Date() } });
  });
}
export async function reportSellerPayment(orderId: string, sellerId: string, reason: string) {
  return scheduleChange(sellerId, "case.seller_payment_reported", "Report", undefined, async (tx) => {
    await sellerCase(tx, orderId, sellerId);
    if (await tx.report.findFirst({ where: { targetType: "order", targetId: orderId, reporterId: sellerId, status: "OPEN" } })) scheduleFail("REPORT_EXISTS", "Ya hay un reporte abierto para este cobro");
    return tx.report.create({ data: { targetType: "order", targetId: orderId, reporterId: sellerId, reason } });
  });
}
export function registerSellerPayment(participantCasesRouter: Router) {
  participantCasesRouter.post("/order/:orderId/confirm-payment", asyncHandler(async (req: AuthedRequest, res) => {
    const row = await confirmSellerPayment(req.params.orderId, req.user!.sub);
    res.json({ data: { sellerConfirmedAt: row.sellerConfirmedAt } });
  }));
  participantCasesRouter.post("/order/:orderId/payment-report", asyncHandler(async (req: AuthedRequest, res) => {
    const input = SellerPaymentReportSchema.parse(req.body);
    res.status(201).json({ data: await reportSellerPayment(req.params.orderId, req.user!.sub, input.reason) });
  }));
}
