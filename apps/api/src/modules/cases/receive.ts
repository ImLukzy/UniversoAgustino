import { ownPhoto } from "./evidence.js";
import { scheduleChange, scheduleFail } from "../staff/scheduleGuard.js";
import { managedCase, caseTransition, type Actor } from "./caseGuard.js";
import { notify } from "../../lib/notify.js";

export async function receiveCase(id: string, actor: Actor, photoUrl: string, conditionNote: string) {
  const row = await scheduleChange(actor.sub, "case.receive", "HandoverCase", id, async (tx) => {
    const existing = await managedCase(tx, id, actor), now = new Date();
    if (existing.assigneeId !== actor.sub) scheduleFail("FORBIDDEN", "Debe recibir el custodio asignado", 403);
    caseTransition(existing.status, "IN_CUSTODY");
    const appointment = existing.appointments.find((a) => a.kind === "DROP_OFF" && a.status === "SCHEDULED");
    if (!appointment || now < appointment.startsAt || now > appointment.endsAt) scheduleFail("BAD_STATE", "La recepción requiere una cita de entrega vigente");
    await ownPhoto(tx, photoUrl, actor.sub);
    await tx.appointment.update({ where: { id: appointment.id }, data: { status: "DONE" } });
    return tx.handoverCase.update({ where: { id }, data: { status: "IN_CUSTODY", receivedPhotoUrl: photoUrl, conditionNote, receivedAt: now }, include: { order: true } });
  });
  await notify({ userId: row.order.buyerId, type: "ORDER_IN_CUSTODY", title: "Objeto recibido por el equipo", body: `${row.order.itemTitle}. El equipo programará tu recojo; pagarás al vendedor al recoger.`, link: "/pedidos" });
  return row;
}
