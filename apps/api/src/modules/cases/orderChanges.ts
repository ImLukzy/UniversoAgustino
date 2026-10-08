import { beforeCustody, canTransition } from "@hub/shared";
import { scheduleChange, scheduleFail } from "../staff/scheduleGuard.js";

export function acceptWithCase(id: string, actorId: string) {
  return scheduleChange(actorId, "order.accept", "order", id, async (tx) => {
    const row = await tx.order.findUniqueOrThrow({ where: { id } });
    if (row.sellerId !== actorId) scheduleFail("FORBIDDEN", "Solo el vendedor acepta", 403);
    if (row.itemType !== "bazar" || !canTransition(row.status, "ACCEPTED")) scheduleFail("BAD_STATE", "La solicitud ya cambió");
    const claimed = await tx.order.updateMany({ where: { id, status: "PENDING", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      data: { status: "ACCEPTED", acceptedAt: new Date(), expiresAt: null } });
    if (!claimed.count) scheduleFail("BAD_STATE", "La solicitud ya cambió o venció");
    await tx.handoverCase.create({ data: { orderId: id } });
    return tx.order.findUniqueOrThrow({ where: { id }, include: { escrow: true } });
  });
}
export function cancelPhysical(id: string, actorId: string) {
  return scheduleChange(actorId, "order.cancel", "order", id, async (tx) => {
    const row = await tx.order.findUniqueOrThrow({ where: { id }, include: { handoverCase: true } });
    if (![row.buyerId, row.sellerId].includes(actorId)) scheduleFail("FORBIDDEN", "No participas en este pedido", 403);
    if (row.itemType !== "bazar" || !canTransition(row.status, "CANCELLED")) scheduleFail("BAD_STATE", "Ya no se puede cancelar");
    if (row.sellerId === actorId && row.status === "PENDING") scheduleFail("BAD_STATE", "Usa el rechazo con motivo");
    if (row.handoverCase && !beforeCustody(row.handoverCase.status)) scheduleFail("IN_CUSTODY", "El objeto requiere retorno asistido por el equipo");
    if (row.handoverCase) {
      await tx.appointment.updateMany({ where: { caseId: row.handoverCase.id, status: "SCHEDULED" }, data: { status: "CANCELLED" } });
      await tx.handoverCase.update({ where: { id: row.handoverCase.id }, data: { status: "CANCELLED", closedAt: new Date() } });
    }
    const result = await tx.order.update({ where: { id }, data: { status: "CANCELLED", cancelledAt: new Date(), expiresAt: null,
      cancelledReason: row.buyerId === actorId ? "BUYER_CANCELLED" : "SELLER_REJECTED" }, include: { escrow: true } });
    await tx.bazarItem.updateMany({ where: { id: row.itemId, status: "RESERVED" }, data: { status: "AVAILABLE" } });
    return result;
  });
}
