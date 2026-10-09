import type { Prisma } from "@prisma/client";
import { scheduleFail } from "../staff/scheduleGuard.js";
export async function isRefundReturn(tx: Prisma.TransactionClient, orderId: string) {
  const p = await tx.payout.findUnique({ where: { orderId }, select: { status: true, refundRequired: true } });
  return p?.status === "FROZEN" && p.refundRequired;
}
export async function requireRefundReturn(tx: Prisma.TransactionClient, orderId: string) {
  if (!await isRefundReturn(tx, orderId)) scheduleFail("BAD_STATE", "La devolución de venta requiere reembolso autorizado");
}
