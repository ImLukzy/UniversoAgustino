import { PickupSchema, type PickupInput } from "@hub/shared";
import { scheduleChange, scheduleFail } from "../staff/scheduleGuard.js";
import { caseTransition, type Actor } from "./caseGuard.js";
import { currentAppointment, orderTransition } from "./fulfillmentGuard.js";
import { bookInside, appointmentNotice } from "./appointments.js";
import { notify } from "../../lib/notify.js";

export async function pickupCase(id: string, actor: Actor, raw: PickupInput) {
  const input = PickupSchema.parse(raw);
  const result = await scheduleChange(actor.sub, "case.pickup", "HandoverCase", id, async (tx) => {
    const { row, appointment, now } = await currentAppointment(tx, id, actor, "PICKUP");
    const rental = !!row.order.rentalEnd, next = rental ? "RENTED_OUT" : "DELIVERED";
    caseTransition(row.status, next);
    const paymentRef = input.paymentMethod === "CASH" ? "efectivo" : input.paymentRef!;
    orderTransition(row.order.status, "PAID");
    await tx.order.update({ where: { id: row.orderId }, data: { status: "PAID", payProof: paymentRef } });
    orderTransition("PAID", "ESCROW");
    await tx.order.update({ where: { id: row.orderId }, data: { status: "ESCROW", escrow: { create: {} } } });
    await tx.bazarItem.update({ where: { id: row.order.itemId }, data: { status: rental ? "RENTED" : "SOLD" } });
    await tx.appointment.update({ where: { id: appointment.id }, data: { status: "DONE" } });
    await tx.handoverCase.update({ where: { id }, data: { status: next, paymentRef, paymentMethod: input.paymentMethod } });
    if (!rental) {
      if (input.returnAppointment) scheduleFail("BAD_STATE", "Una venta no tiene devolución de alquiler");
      orderTransition("ESCROW", "RELEASED");
      await tx.order.update({ where: { id: row.orderId }, data: { status: "RELEASED", escrow: { update: { releasedAt: now } } } });
      caseTransition("DELIVERED", "CLOSED");
      await tx.handoverCase.update({ where: { id }, data: { status: "CLOSED", closedAt: now } });
    }
    const booking = rental && input.returnAppointment ? await bookInside(tx, id, actor, input.returnAppointment) : null;
    await tx.auditLog.create({ data: { actorId: actor.sub, action: "order.physical_payment", entity: "order", entityId: row.orderId,
      meta: JSON.stringify({ paymentMethod: input.paymentMethod, paymentRef, transitions: rental ? ["PAID", "ESCROW"] : ["PAID", "ESCROW", "RELEASED"] }) } });
    return { row: await tx.handoverCase.findUniqueOrThrow({ where: { id }, include: { order: true } }), booking };
  });
  const { row, booking } = result;
  await Promise.all([notify({ userId: row.order.sellerId, type: "ORDER_PICKUP_COMPLETED", title: "Objeto entregado y pago registrado",
    body: `${row.order.itemTitle} — S/ ${(row.order.amountCents / 100).toFixed(2)}; ${row.paymentRef}. Verifica y confirma tu cobro en Ventas.`, link: "/ventas" }),
    notify({ userId: row.order.buyerId, type: "ORDER_PICKUP_COMPLETED", title: "Recojo completado", body: `${row.order.itemTitle}. ${row.order.rentalEnd ? "Consulta la cita de devolución de tu alquiler." : "Venta completada."}`, link: "/pedidos" })]);
  if (booking) await appointmentNotice(booking);
  return row;
}
