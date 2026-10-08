import { caseTransition, type Actor } from "./caseGuard.js";
import { currentAppointment, orderTransition } from "./fulfillmentGuard.js";
import { scheduleChange, scheduleFail } from "../staff/scheduleGuard.js";
import { notify } from "../../lib/notify.js";

export async function backToSeller(id: string, actor: Actor) {
  const row = await scheduleChange(actor.sub, "case.back_to_seller", "HandoverCase", id, async (tx) => {
    const { row: existing, appointment, now } = await currentAppointment(tx, id, actor, "BACK_TO_SELLER");
    caseTransition(existing.status, "CLOSED");
    if (!existing.returnedAt) {
      orderTransition(existing.order.status, "CANCELLED");
      await tx.order.update({ where: { id: existing.orderId }, data: { status: "CANCELLED", cancelledAt: now, cancelledReason: "TEAM_RETURNED", expiresAt: null } });
    } else if (existing.order.status !== "RELEASED") scheduleFail("BAD_STATE", "El alquiler no terminó su revisión");
    await tx.appointment.update({ where: { id: appointment.id }, data: { status: "DONE" } });
    await tx.bazarItem.update({ where: { id: existing.order.itemId }, data: { status: "AVAILABLE" } });
    await tx.auditLog.create({ data: { actorId: actor.sub, action: "order.physical_return", entity: "order", entityId: existing.orderId } });
    return tx.handoverCase.update({ where: { id }, data: { status: "CLOSED", closedAt: now }, include: { order: true } });
  });
  await Promise.all([row.order.buyerId, row.order.sellerId].map((userId) => notify({ userId,
    type: row.order.status === "CANCELLED" ? "ORDER_CANCELLED" : "ORDER_RETURN_COMPLETED", title: "Objeto devuelto al vendedor",
    body: `${row.order.itemTitle}. El trato se cerró y el artículo está disponible.`, link: userId === row.order.buyerId ? "/pedidos" : "/ventas" })));
  return row;
}
