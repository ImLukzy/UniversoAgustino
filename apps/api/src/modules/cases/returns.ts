import { ReturnReviewSchema } from "@hub/shared";
import { scheduleChange, scheduleFail } from "../staff/scheduleGuard.js";
import { caseTransition, type Actor } from "./caseGuard.js";
import { currentAppointment } from "./fulfillmentGuard.js";
import { ownPhoto } from "./evidence.js";
import { notify } from "../../lib/notify.js";

export async function returnCase(id: string, actor: Actor, raw: unknown) {
  const input = ReturnReviewSchema.parse(raw);
  const row = await scheduleChange(actor.sub, "case.return", "HandoverCase", id, async (tx) => {
    const { row: existing, appointment, now } = await currentAppointment(tx, id, actor, "RETURN");
    caseTransition(existing.status, "RETURNED");
    if (!["ESCROW", "RELEASED"].includes(existing.order.status)) scheduleFail("BAD_STATE", "El pago no fue verificado");
    if (input.photoUrl) await ownPhoto(tx, input.photoUrl, actor.sub);
    await tx.appointment.update({ where: { id: appointment.id }, data: { status: "DONE" } });
    await tx.auditLog.create({ data: { actorId: actor.sub, action: "order.rental_return", entity: "order", entityId: existing.orderId,
      meta: JSON.stringify({ condition: input.condition, conditionNote: input.conditionNote, photoUrl: input.photoUrl }) } });
    return tx.handoverCase.update({ where: { id }, data: { status: "RETURNED", returnedAt: now, backToSellerRequestedAt: now,
      returnCondition: input.condition, returnConditionNote: input.conditionNote, returnPhotoUrl: input.photoUrl ?? null }, include: { order: true } });
  });
  await Promise.all([row.order.buyerId, row.order.sellerId].map((userId) => notify({ userId, type: "ORDER_RETURN_COMPLETED", title: "Devolución de alquiler revisada",
    body: `${row.order.itemTitle} — ${row.returnCondition === "OK" ? "Estado conforme" : "Observaciones registradas"}. ${row.returnConditionNote}. El equipo conserva el objeto hasta devolverlo al vendedor.`, link: userId === row.order.buyerId ? "/pedidos" : "/ventas" })));
  return row;
}
