import { beforeCustody, canTransition } from "@hub/shared";
import { scheduleChange, scheduleFail } from "../staff/scheduleGuard.js";
import { caseTransition, managedCase, type Actor } from "./caseGuard.js";
import { notify } from "../../lib/notify.js";

export async function cancelCase(id: string, actor: Actor) {
  const row = await scheduleChange(actor.sub, "case.cancel", "HandoverCase", id, async (tx) => {
    const existing = await managedCase(tx, id, actor);
    if (!beforeCustody(existing.status)) scheduleFail("IN_CUSTODY", "El objeto requiere retorno asistido antes de cancelar");
    caseTransition(existing.status, "CANCELLED");
    if (!canTransition(existing.order.status, "CANCELLED")) scheduleFail("BAD_STATE", "El pedido ya cambió");
    await tx.appointment.updateMany({ where: { caseId: id, status: "SCHEDULED" }, data: { status: "CANCELLED" } });
    await tx.order.update({ where: { id: existing.orderId }, data: { status: "CANCELLED", cancelledAt: new Date(),
      cancelledReason: "TEAM_CANCELLED", expiresAt: null } });
    await tx.bazarItem.updateMany({ where: { id: existing.order.itemId, status: "RESERVED" }, data: { status: "AVAILABLE" } });
    await tx.auditLog.create({ data: { actorId: actor.sub, action: "order.cancel", entity: "order", entityId: existing.orderId,
      meta: JSON.stringify({ reason: "TEAM_CANCELLED", caseId: id }) } });
    return tx.handoverCase.update({ where: { id }, data: { status: "CANCELLED", closedAt: new Date() }, include: { order: true } });
  });
  await Promise.all([row.order.buyerId, row.order.sellerId].map((userId) => notify({ userId, type: "ORDER_CANCELLED", title: "Trato cancelado por el equipo",
    body: `${row.order.itemTitle} — se canceló antes de recibir el objeto.`, link: userId === row.order.buyerId ? "/pedidos" : "/ventas" })));
  return row;
}
