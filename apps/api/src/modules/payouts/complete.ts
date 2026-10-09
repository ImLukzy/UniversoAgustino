import { REFUND_REQUIRED } from "./refundRequired.js";
import { notify, buyerOrderLink } from "../../lib/notify.js";
import { canTransition, CompletePayoutSchema, ResumePayoutSchema } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { ownPhoto } from "../cases/evidence.js";
import { accountRole } from "../staff/accountPermissions.js";
import { scheduleFail } from "../staff/scheduleGuard.js";
import { payoutNotice } from "./notices.js";
export async function completePayout(id: string, actorId: string, body: unknown) {
  const input = CompletePayoutSchema.parse(body);
  const payout = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(300030)::text`;
    const role = await accountRole(tx, actorId);
    const p = await tx.payout.findUniqueOrThrow({ where: { id }, include: { order: true } });
    if (role !== "admin" && p.collectorId !== actorId) scheduleFail("FORBIDDEN", "Solo el cobrador o el Técnico liquida", 403);
    if (p.status !== "PENDING" || !canTransition(p.order.status, "RELEASED")) scheduleFail("BAD_STATE", "La liquidación no está pendiente o está congelada");
    await ownPhoto(tx, input.proofUrl, actorId);
    await tx.upload.update({ where: { storedName: input.proofUrl.slice(9) }, data: { private: true } });
    const now = new Date();
    const updated = await tx.payout.update({ where: { id }, data: { status: "COMPLETED", proofUrl: input.proofUrl,
      paymentRef: input.paymentRef ?? null, completedAt: now, completedById: actorId } });
    await tx.order.update({ where: { id: p.orderId }, data: { status: "RELEASED", escrow: { update: { releasedAt: now } } } });
    await tx.auditLog.create({ data: { actorId, action: "payout.complete", entity: "payout", entityId: id } });
    return { payout: updated, buyerId: p.order.buyerId };
  });
  await payoutNotice(payout.payout, "PAYOUT_COMPLETED");
  await notify({ userId: payout.buyerId, type: "ORDER_RELEASED", title: "Liquidación completada", body: "El equipo pagó al vendedor. Consulta el estado de tu pedido en Mis pedidos.", link: buyerOrderLink(payout.payout.orderId) });
  return payout.payout;
}
export async function resumePayout(id: string, actorId: string, body: unknown) {
  const input = ResumePayoutSchema.parse(body);
  const payout = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(300030)::text`;
    if (await accountRole(tx, actorId) !== "admin") scheduleFail("FORBIDDEN", "Solo el Técnico resuelve el reclamo", 403);
    const p = await tx.payout.findUniqueOrThrow({ where: { id }, include: { order: true } });
    if (p.refundRequired) scheduleFail("REFUND_REQUIRED", REFUND_REQUIRED);
    if (p.status !== "FROZEN" || p.order.status !== "ESCROW") scheduleFail("BAD_STATE", "No hay liquidación congelada");
    const updated = await tx.payout.update({ where: { id }, data: { status: "PENDING", frozenReason: null, reminderSentAt: null } });
    await tx.report.updateMany({ where: { targetType: "order", targetId: p.orderId, status: "OPEN" }, data: { status: "ACTIONED" } });
    await tx.auditLog.create({ data: { actorId, action: "payout.resume", entity: "payout", entityId: id, meta: JSON.stringify(input) } });
    return { payout: updated, buyerId: p.order.buyerId };
  });
  await payoutNotice(payout.payout, "PAYOUT_RESUMED");
  await notify({ userId: payout.buyerId, type: "PAYOUT_RESUMED", title: "Reclamo resuelto", body: "El Técnico revisó el reclamo y autorizó liquidar al vendedor.", link: buyerOrderLink(payout.payout.orderId) });
  return payout.payout;
}
