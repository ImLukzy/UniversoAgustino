import { canTransition, RefundPayoutSchema } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { ownPhoto } from "../cases/evidence.js";
import { accountRole } from "../staff/accountPermissions.js";
import { scheduleFail } from "../staff/scheduleGuard.js";
import { notify } from "../../lib/notify.js";
import { refundPhysical } from "./refundPhysical.js";

export async function refundPayout(id: string, actorId: string, body: unknown) {
  const input = RefundPayoutSchema.parse(body);
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(300030)::text`;
    if (await accountRole(tx, actorId) !== "admin") scheduleFail("FORBIDDEN", "Solo el Técnico registra reembolsos", 403);
    const p = await tx.payout.findUniqueOrThrow({ where: { id }, include: { order: true } });
    if (p.status !== "FROZEN" || !p.refundRequired || !canTransition(p.order.status, "REFUNDED"))
      scheduleFail("BAD_STATE", "No hay reembolso autorizado pendiente");
    await ownPhoto(tx, input.proofUrl, actorId);
    const now = new Date();
    if (p.order.itemType === "bazar") await refundPhysical(tx, p.orderId, now);
    await tx.upload.update({ where: { storedName: input.proofUrl.slice(9) }, data: { private: true } });
    if (p.order.itemType === "document") await tx.documentAccessGrant.updateMany({
      where: { orderId: p.orderId, revokedAt: null }, data: { revokedAt: now },
    });
    await tx.order.update({ where: { id: p.orderId }, data: { status: "REFUNDED", expiresAt: null } });
    const updated = await tx.payout.update({ where: { id }, data: { status: "REFUNDED", refundProofUrl: input.proofUrl,
      refundPaymentRef: input.paymentRef ?? null, refundedAt: now, refundedById: actorId } });
    await tx.report.updateMany({ where: { targetType: "order", targetId: p.orderId, status: "OPEN" }, data: { status: "ACTIONED" } });
    await tx.auditLog.create({ data: { actorId, action: "payout.refund", entity: "payout", entityId: id,
      meta: JSON.stringify({ amountCents: p.amountCents, proofUrl: input.proofUrl, paymentRef: input.paymentRef ?? null }) } });
    return { payout: updated, buyerId: p.order.buyerId, itemType: p.order.itemType };
  });
  const p = result.payout;
  await Promise.all([...new Set([result.buyerId, p.sellerId, p.collectorId])].map((userId) => notify({
    userId, type: "ORDER_REFUNDED", title: "Reembolso registrado",
    body: userId === result.buyerId ? `El equipo devolvió S/ ${(p.amountCents / 100).toFixed(2)}. Consulta el comprobante en Mis pedidos.${result.itemType === "document" ? " El acceso al apunte fue revocado." : " Coordina el destino del objeto con el equipo."}` :
      "El equipo reembolsó al comprador. Esta venta no genera liquidación al vendedor ni comisión.",
    link: userId === result.buyerId ? "/pedidos" : userId === p.sellerId ? "/ventas?tab=cobros#mis-cobros" : "/equipo?tab=liquidaciones",
  })));
  return p;
}
