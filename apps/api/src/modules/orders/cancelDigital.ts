import { canTransition } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { scheduleFail } from "../staff/scheduleGuard.js";
export async function cancelDigitalOrder(id: string, actorId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(300030)::text`;
    const order = await tx.order.findUniqueOrThrow({ where: { id } });
    if (actorId !== order.buyerId && actorId !== order.sellerId) scheduleFail("FORBIDDEN", "No participas en este pedido", 403);
    if (order.proofSubmittedAt || !["PENDING", "ACCEPTED"].includes(order.status) || !canTransition(order.status, "CANCELLED")) {
      scheduleFail("PAYMENT_REVIEW", "El equipo debe revisar un pago declarado antes de cancelar");
    }
    const updated = await tx.order.update({ where: { id }, data: { status: "CANCELLED", cancelledAt: new Date(), expiresAt: null,
      cancelledReason: actorId === order.buyerId ? "BUYER_CANCELLED" : "SELLER_REJECTED" }, include: { escrow: true } });
    await tx.auditLog.create({ data: { actorId, action: "order.cancel", entity: "order", entityId: id } });
    return updated;
  });
}
